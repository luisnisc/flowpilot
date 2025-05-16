import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import bcryptjs from "bcryptjs"; // Cambiado de bcrypt a bcryptjs
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { token, password } = req.body;

  if (
    !token ||
    !password ||
    typeof token !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({ error: "Token y contraseña requeridos" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("app");

    console.log("Buscando usuario con token:", token);

    // Buscar usuario con el token proporcionado y que no haya expirado
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    console.log("Usuario encontrado:", user ? "Sí" : "No");

    // Mostrar la estructura del documento de usuario (quitando datos sensibles)
    if (user) {
      console.log("Estructura del documento de usuario:", Object.keys(user));
      console.log("Tipo de _id:", typeof user._id);
      console.log("¿Tiene campo password?", user.hasOwnProperty("password"));
      console.log(
        "¿Tiene campo passwordHash?",
        user.hasOwnProperty("passwordHash")
      );
    } else {
      // Verifica si existe el token en la base de datos sin tener en cuenta la fecha de expiración
      const userWithToken = await db.collection("users").findOne({
        resetToken: token,
      });

      if (userWithToken) {
        console.log("Usuario con token encontrado pero posiblemente expirado");
        console.log("Fecha de expiración:", userWithToken.resetTokenExpiry);
        console.log("Fecha actual:", new Date());
      } else {
        console.log("No se encontró ningún usuario con ese token");
      }

      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    // Encriptar la nueva contraseña con bcryptjs para compatibilidad con NextAuth
    const hashedPassword = await bcryptjs.hash(password, 12);
    console.log("Contraseña hasheada correctamente con bcryptjs");

    // Convertir _id a ObjectId si es necesario
    const userId =
      typeof user._id === "string" ? new ObjectId(user._id) : user._id;

    console.log("Actualizando contraseña para usuario:", userId);

    // Determinar el campo correcto de la contraseña basado en la estructura del documento
    let updateFields = {};
    if (user.hasOwnProperty("password")) {
      updateFields = { password: hashedPassword };
    } else if (user.hasOwnProperty("passwordHash")) {
      updateFields = { passwordHash: hashedPassword };
    } else {
      // Si no encontramos un campo de contraseña conocido, intentemos con ambos
      updateFields = {
        password: hashedPassword,
        passwordHash: hashedPassword,
      };
    }

    // Actualizar contraseña y eliminar token de restablecimiento
    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: updateFields,
        $unset: { resetToken: "", resetTokenExpiry: "" },
      }
    );

    console.log("Resultado de actualización:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
    });

    // Verificar si la actualización fue exitosa
    if (updateResult.modifiedCount === 0) {
      console.error("No se actualizó ningún documento");
      // Intentar actualizar sin $unset para ver si ese es el problema
      const retryUpdate = await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: updateFields });

      console.log("Segundo intento (solo $set):", {
        matchedCount: retryUpdate.matchedCount,
        modifiedCount: retryUpdate.modifiedCount,
      });

      if (retryUpdate.modifiedCount === 0) {
        return res.status(500).json({
          error: "No se pudo actualizar la contraseña",
          details: "La operación de actualización no modificó ningún documento",
        });
      }
    }

    return res
      .status(200)
      .json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    return res.status(500).json({
      error: "Error al actualizar la contraseña",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
