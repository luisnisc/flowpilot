import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { randomBytes } from "crypto";
import sgMail from "@sendgrid/mail";

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

    // Buscar usuario por email
    const user = await db
      .collection("users")
      .findOne({ email: email.toLowerCase() });

    // Por seguridad, no revelamos si el email existe o no
    if (!user) {
      return res.status(200).json({
        message:
          "Si existe una cuenta con este email, recibirás instrucciones para restablecer tu contraseña.",
      });
    }

    // Generar token único y establecer fecha de expiración (1 hora)
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora en milisegundos

    // Guardar token en la base de datos
    await db.collection("users").updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        },
      }
    );

    // URL del frontend para restablecer la contraseña
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // En modo desarrollo, mostrar información en la consola para depuración
    console.log("============================================");
    console.log("Información de restablecimiento de contraseña:");
    console.log("Email:", email);
    console.log("Token:", resetToken);
    console.log("URL:", resetUrl);
    console.log("Expira:", resetTokenExpiry);
    console.log("============================================");

    try {
      // Verificar que la API key está configurada
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        console.error(
          "Error: SENDGRID_API_KEY no está configurada en las variables de entorno"
        );
        throw new Error("SENDGRID_API_KEY no configurada");
      }

      // Configurar SendGrid con la API key
      sgMail.setApiKey(apiKey);

      const sender = process.env.EMAIL_FROM || "noreply@flow-pilot.dev";
      console.log("Intentando enviar email desde:", sender);

      // Preparar el mensaje
      const msg = {
        to: email,
        from: sender,
        subject: "Restablece tu contraseña de FlowPilot",
        text: `Hola,\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace: ${resetUrl}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.\n\nSaludos,\nEquipo FlowPilot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Restablece tu contraseña de FlowPilot</h2>
            <p>Hola,</p>
            <p>Has solicitado restablecer tu contraseña en FlowPilot. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Restablecer contraseña</a>
            </p>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.</p>
            <p>Saludos,<br>Equipo FlowPilot</p>
          </div>
        `,
      };

      // Enviar email y manejar la respuesta
      console.log("Enviando email...");
      const response = await sgMail.send(msg);
      console.log(
        "Email enviado correctamente, respuesta:",
        response[0].statusCode
      );

      // Si estamos en desarrollo, devolver información adicional
      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({
          message:
            "Email enviado correctamente. Revisa la consola para más detalles.",
          success: true,
          devInfo: {
            resetToken,
            resetUrl,
            expiresAt: resetTokenExpiry,
          },
        });
      }
    } catch (emailError: any) {
      console.error("Error al enviar email con SendGrid:", emailError);

      // Detalles específicos del error para depuración
      if (emailError.response) {
        console.error("Detalles del error:");
        console.error("  Status:", emailError.response.status);
        console.error("  Body:", emailError.response.body);
      }

      // En desarrollo, proporcionar información más detallada
      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({
          message:
            "Error al enviar email, pero el token fue generado. Revisa la consola para ver el token.",
          error: emailError.message,
          devInfo: {
            resetToken,
            resetUrl,
            expiresAt: resetTokenExpiry,
          },
        });
      }
    }

    // Respuesta estándar para producción (o si falla el envío en desarrollo)
    return res.status(200).json({
      message:
        "Si existe una cuenta con este email, recibirás instrucciones para restablecer tu contraseña.",
    });
  } catch (error) {
    console.error(
      "Error en solicitud de restablecimiento de contraseña:",
      error
    );
    return res.status(500).json({ error: "Error al procesar la solicitud" });
  }
}
