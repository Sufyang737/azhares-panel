import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  clientName: string;
  formUrl?: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({
  clientName,
  formUrl,
}) => {
  const formularioUrl = formUrl || '';

  return (
    <Html>
      <Head />
      <Preview>Gracias por contar con Azares para tu evento.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo y Encabezado */}
          <Section style={logoSection}>
            <Img
              src="https://ik.imagekit.io/majzpqwjy/logo.png?updatedAt=1747419729873"
              width="130"
              height="105"
              alt="Azares"
              style={logo}
            />
            <Text style={subHeader}>EVENT PLANNERS</Text>
          </Section>

          <Heading style={h1}>¡Bienvenido!</Heading>
          
          <Heading style={h2}>
            Gracias por contar con Azares para tu evento.
          </Heading>

          <Text style={text}>
            Hola {clientName}, queremos darte la Bienvenida a Azares Eventos, es un placer que nos hayan elegido.
          </Text>

          <Text style={text}>
            Para comenzar a trabajar juntos, te pedimos que completes el siguiente {' '}
            {formularioUrl && (
              <a href={formularioUrl} style={link}>
                formulario
              </a>
            )}{' '}
            para registrarte como cliente en nuestro sistema.
          </Text>

          <Text style={text}>
            Pronto te estaremos enviando nuestra propuesta de servicios.
          </Text>

          <Text style={text}>
            Si tenes alguna duda o comentario, no dudes en contactarnos.
          </Text>

          <Text style={signature}>
            Saludos cordiales,
          </Text>

          <Text style={signatureCompany}>
            Azares Eventos
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#FFF5F1',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const logoSection = {
  textAlign: 'left' as const,
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
  display: 'block',
};

const subHeader = {
  color: '#4A3531',
  fontSize: '14px',
  margin: '4px 0 0',
  textAlign: 'left' as const,
};

const h1 = {
  color: '#4A3531',
  fontSize: '28px',
  fontWeight: '500',
  lineHeight: '1.3',
  margin: '0 0 16px',
  textAlign: 'left' as const,
};

const h2 = {
  color: '#4A3531',
  fontSize: '24px',
  fontWeight: '400',
  lineHeight: '1.3',
  margin: '0 0 24px',
  textAlign: 'left' as const,
};

const text = {
  color: '#4A3531',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
  textAlign: 'left' as const,
};

const link = {
  color: '#F5D0C5',
  textDecoration: 'underline',
};

const signature = {
  color: '#6B4D45',
  fontSize: '16px',
  fontStyle: 'italic',
  margin: '32px 0 8px',
  textAlign: 'left' as const,
};

const signatureCompany = {
  color: '#4A3531',
  fontSize: '18px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'left' as const,
};

export default WelcomeEmail; 