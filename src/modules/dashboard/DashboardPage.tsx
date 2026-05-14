import { Card, Col, Row, Typography, Space } from 'antd';
import {
  FilePdfOutlined,
  HighlightOutlined,
  FormOutlined,
  EyeInvisibleOutlined,
  FileImageOutlined,
  SwapOutlined,
  EditOutlined,
  CheckSquareOutlined,
  QrcodeOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';

const { Title, Paragraph } = Typography;

export function DashboardPage() {
  const setActiveModule = useAppStore(state => state.setActiveModule);
  
  const quickActions = [
    {
      title: 'Anotaciones',
      description: 'Resalta, subraya y agrega notas a tus documentos PDF.',
      icon: <HighlightOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      module: 'annotations' as const,
    },
    {
      title: 'Redactar',
      description: 'Oculta permanentemente información sensible con rectángulos negros.',
      icon: <EyeInvisibleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />,
      module: 'redact' as const,
    },
    {
      title: 'Formularios',
      description: 'Llena formularios existentes o crea nuevos campos interactivos.',
      icon: <FormOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      module: 'forms' as const,
    },
    {
      title: 'Editor PDF',
      description: 'Une varios archivos y reordena páginas visualmente.',
      icon: <FilePdfOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      module: 'pdf-editor' as const,
    },
    {
      title: 'Extraer Imágenes',
      description: 'Extrae todas las imágenes incrustadas dentro de un PDF.',
      icon: <FileImageOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      module: 'image-extractor' as const,
    },
    {
      title: 'Convertidor',
      description: 'Convierte archivos Office o imágenes a formato PDF.',
      icon: <SwapOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
      module: 'converter' as const,
    },
    {
      title: 'Escáner QR',
      description: 'Escanea códigos QR y de barras desde cámara o imagen.',
      icon: <QrcodeOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      module: 'qr-scanner' as const,
    },
    {
      title: 'Editor de Imágenes',
      description: 'Recorta, rota, aplica filtros y agrega texto a imágenes.',
      icon: <ScissorOutlined style={{ fontSize: 32, color: '#fa541c' }} />,
      module: 'image-editor' as const,
    },
  ];

  const signatureActions = [
    {
      title: 'Firmas Digitales',
      description: 'Crea, guarda y usa firmas manuscritas para firmar tus PDFs.',
      icon: <EditOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      module: 'signatures' as const,
    },
    {
      title: 'Sellos',
      description: 'Crea y guarda sellos personalizados (Aprobado, Urgente, etc.).',
      icon: <CheckSquareOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      module: 'stamps' as const,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={1} style={{ fontSize: '3rem', marginBottom: 8, background: 'linear-gradient(90deg, #1890ff, #722ed1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          PDF Toolkit
        </Title>
        <Paragraph style={{ fontSize: 18, color: 'var(--ant-color-text-secondary)' }}>
          Tu suite profesional de herramientas para manipular documentos PDF de forma local y segura.
        </Paragraph>
      </div>

      <Title level={3} style={{ marginBottom: 24 }}>Acciones Rápidas</Title>
      
      <Row gutter={[24, 24]}>
        {quickActions.map((action, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              hoverable
              onClick={() => setActiveModule(action.module)}
              style={{ height: '100%', borderRadius: 12, border: '1px solid var(--ant-color-border-secondary)' }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                  background: 'var(--ant-color-bg-layout)', 
                  width: 64, 
                  height: 64, 
                  borderRadius: 16, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {action.icon}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, marginBottom: 8 }}>{action.title}</Title>
                  <Paragraph style={{ color: 'var(--ant-color-text-secondary)', margin: 0 }}>
                    {action.description}
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={3} style={{ marginTop: 32, marginBottom: 24 }}>Firmas y Sellos</Title>
      <Paragraph style={{ color: 'var(--ant-color-text-secondary)', marginBottom: 24 }}>
        Crea y gestiona tus firmas digitales y sellos para agregar a tus documentos PDF.
      </Paragraph>
      
      <Row gutter={[24, 24]}>
        {signatureActions.map((action, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              hoverable
              onClick={() => setActiveModule(action.module)}
              style={{ height: '100%', borderRadius: 12, border: '1px solid var(--ant-color-border-secondary)' }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                  background: 'var(--ant-color-bg-layout)', 
                  width: 64, 
                  height: 64, 
                  borderRadius: 16, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {action.icon}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, marginBottom: 8 }}>{action.title}</Title>
                  <Paragraph style={{ color: 'var(--ant-color-text-secondary)', margin: 0 }}>
                    {action.description}
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
