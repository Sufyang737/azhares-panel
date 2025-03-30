import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  clientName: string;
  eventName: string;
  eventDate: string;
  plannerName: string;
  clienteId?: string;
  formUrl?: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({
  clientName,
  eventName,
  eventDate,
  plannerName,
  clienteId,
  formUrl,
}) => {
  // Construir la URL del formulario
  const formularioUrl = formUrl || 
    (clienteId ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/formulario/${encodeURIComponent(clienteId)}` : '');

  return (
    <Html>
      <Head />
      <Preview>Bienvenido a Azhares Panel - Tu evento está confirmado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Bienvenido a Azhares Panel!</Heading>
          <Text style={text}>
            Estimado/a {clientName},
          </Text>
          <Text style={text}>
            ¡Nos complace darle la bienvenida a Azhares Panel! Su evento ha sido registrado exitosamente en nuestro sistema.
          </Text>
          <Text style={text}>
            Detalles de su evento:
          </Text>
          <Text style={details}>
            • Nombre del evento: {eventName}<br />
            • Fecha: {eventDate}<br />
            • Planificador asignado: {plannerName}
          </Text>
          
          {formularioUrl && (
            <Section style={ctaSection}>
              <Text style={text}>
                Para brindarle un mejor servicio, necesitamos algunos datos adicionales. Por favor, complete el siguiente formulario:
              </Text>
              <Button
                href={formularioUrl}
                style={button}
              >
                Completar mis datos
              </Button>
            </Section>
          )}
          
          <Text style={text}>
            Nuestro equipo está comprometido a hacer de su evento una experiencia inolvidable. Su planificador asignado se pondrá en contacto con usted próximamente para discutir los detalles.
          </Text>
          <Text style={text}>
            Si tiene alguna pregunta o inquietud inmediata, no dude en contactarnos.
          </Text>
          <Text style={footer}>
            Saludos cordiales,<br />
            El equipo de Azhares
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
};

const text = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '12px 0',
};

const details = {
  color: '#1a1a1a',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '24px 0',
  padding: '24px',
  backgroundColor: '#f7f7f7',
  borderRadius: '4px',
};

const ctaSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#5e17eb',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 16px',
  margin: '0 auto',
  width: '220px',
};

const footer = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '24px 0 0',
};

export default WelcomeEmail; 