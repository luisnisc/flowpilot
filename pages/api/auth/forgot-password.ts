import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { randomBytes } from "crypto";
import { EmailTemplate } from '../../../src/app/components/email-template';
import { Resend } from 'resend';

// Inicializamos Resend con la API KEY
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email requerido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("app");

    const user = await db
      .collection("users")
      .findOne({ email: email.toLowerCase() });

    if (!user) {
      // Por seguridad, devolvemos 200 aunque el usuario no exista
      return res.status(200).json({
        message: "Si existe una cuenta con este email, recibirás instrucciones para restablecer tu contraseña.",
      });
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await db.collection("users").updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        },
      }
    );

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    try {
      // 1. Verificación de API KEY
      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY no configurada");
      }

      const sender = process.env.EMAIL_FROM || "onboarding@resend.dev";

      // 2. Envío con Resend usando el componente React
      const { data, error } = await resend.emails.send({
        from: `noreply@flow-pilot.dev`,
        to: [email],
        subject: "Restablece tu contraseña de FlowPilot",
        // Aquí usamos tu componente de React directamente
        react: EmailTemplate({ resetUrl }) as React.ReactElement,
        // Fallback en texto plano para clientes de correo antiguos
        text: `Hola, para restablecer tu contraseña haz clic aquí: ${resetUrl}`,
      });

      if (error) {
        throw error;
      }

      console.log("Email enviado con Resend ID:", data?.id);

    } catch (emailError: any) {
      console.error("Error al enviar email con Resend:", emailError);

      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({
          message: "Error al enviar email, pero el token fue generado.",
          error: emailError.message,
          devInfo: { resetToken, resetUrl },
        });
      }
    }

    return res.status(200).json({
      message: "Si existe una cuenta con este email, recibirás instrucciones para restablecer tu contraseña.",
    });

  } catch (error) {
    console.error("Error en solicitud de restablecimiento:", error);
    return res.status(500).json({ error: "Error al procesar la solicitud" });
  }
}