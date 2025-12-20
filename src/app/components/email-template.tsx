import { 
  Html, Body, Container, Text, 
  Link, Section, Heading, Hr 
} from "@react-email/components";

export const EmailTemplate = ({ resetUrl }: { resetUrl: string }) => {
  return (
    <div className="bg-slate-50 py-10 font-sans">
      <div className="max-w-[580px] mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="bg-[#4F46E5] p-8 text-center">
          <h1 className="text-white text-2xl font-extrabold tracking-tight m-0">
            Flow<span className="opacity-80">Pilot</span>
          </h1>
        </div>

        <div className="p-10">
          <Heading className="text-slate-900 text-xl font-bold mb-4">
            Restablecer contraseña
          </Heading>
          
          <Text className="text-slate-600 text-base leading-7 mb-6">
            Hola, hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>FlowPilot</strong>.
          </Text>

          <Section className="text-center my-8">
            <Link
              href={resetUrl}
              className="bg-[#4F46E5] text-white px-8 py-4 rounded-lg font-bold text-sm no-underline inline-block shadow-md hover:bg-[#4338ca] transition-colors"
            >
              Cambiar contraseña
            </Link>
          </Section>

          <Text className="text-slate-500 text-sm leading-6 mb-4">
            Por seguridad, este enlace es de un solo uso y caducará en <strong>60 minutos</strong>. 
          </Text>

          <Hr className="border-slate-200 my-8" />

          <Text className="text-slate-400 text-xs leading-5">
            Si no has solicitado este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no cambiará hasta que accedas al enlace y crees una nueva.
          </Text>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <Text className="text-slate-400 text-xs m-0">
            © 2025 FlowPilot. España <br />
            Enviado con ❤️ desde el equipo de desarrollo.
          </Text>
        </div>
      </div>
    </div>
  );
};