import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  
  const { email, name, password } = req.body;
  
  if (!email || !name || !password) {
    return res.status(400).json({ 
      error: "Todos los campos son obligatorios" 
    });
  }
  
  try {
    const client = await clientPromise;
    const db = client.db("app");
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await db.collection("users").findOne({ 
      email: normalizedEmail 
    });
    
    if (existingUser) {
      if (!existingUser.password) {
        const hash = await bcrypt.hash(password, 12);
        await db.collection("users").updateOne(
          { email: normalizedEmail },
          { 
            $set: { 
              password: hash,
              name: name || existingUser.name 
            } 
          }
        );
        
        return res.status(200).json({ 
          success: true, 
          message: "Credenciales locales añadidas a tu cuenta existente. Ahora puedes iniciar sesión con email y contraseña.",
          email: normalizedEmail,
          name: name || existingUser.name
        });
      } else {
        return res.status(409).json({ 
          error: "Ya existe una cuenta con este email. Intenta iniciar sesión o usar 'Olvidé mi contraseña'." 
        });
      }
    }
    
    const hash = await bcrypt.hash(password, 12);
    const result = await db.collection("users").insertOne({ 
      email: normalizedEmail,  
      name, 
      password: hash, 
      role: "user",
      createdAt: new Date(),
      emailVerified: null 
    });
    
    return res.status(201).json({ 
      success: true,
      id: result.insertedId, 
      email: normalizedEmail, 
      name, 
      role: "user" 
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    return res.status(500).json({ 
      error: "Error al crear la cuenta. Por favor, inténtalo de nuevo." 
    });
  }
}