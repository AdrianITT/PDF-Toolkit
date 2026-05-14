import { ConfigProvider, Layout, Menu, theme } from 'antd';
import {
  FilePdfOutlined,
  BgColorsOutlined,
  EditOutlined,
  PictureOutlined,
  StarOutlined,
  SwapOutlined,
  ToolOutlined,
  ScanOutlined,
  HighlightOutlined,
  FormOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  FileImageOutlined,
  EyeInvisibleOutlined,
  FileProtectOutlined,
  PlayCircleOutlined,
  HomeOutlined,
  QrcodeOutlined,
  ScissorOutlined,
  AppstoreOutlined,
  FileWordOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { PdfEditorPage } from './modules/pdf-editor/PdfEditorPage';
import { WatermarkPage } from './modules/watermark/WatermarkPage';
import { SignaturesPage } from './modules/signatures/SignaturesPage';
import { HtmlToImagePage } from './modules/html-to-image/HtmlToImagePage';
import { StampsPage } from './modules/stamps/StampsPage';
import { ConverterPage } from './modules/converter/ConverterPage';
import { PdfToolsPage } from './modules/pdf-tools/PdfToolsPage';
import { OcrPage } from './modules/ocr/OcrPage';
import { AnnotationsPage } from './modules/annotations/AnnotationsPage';
import { PdfFormsPage } from './modules/forms/PdfFormsPage';
import { DigitalSignaturePage } from './modules/digital-signature/DigitalSignaturePage';
import { PdfComparerPage } from './modules/compare/PdfComparePage';
import { ImageExtractorPage } from './modules/image-extractor/ImageExtractorPage';
import { MetadataEditorPage } from './modules/metadata/MetadataEditorPage';
import { RedactPage } from './modules/redact/RedactPage';
import { PdfACompliancePage } from './modules/compliance/PdfACompliancePage';
import { TemplatesPage } from './modules/templates/TemplatesPage';
import { BatchProcessingPage } from './modules/batch/BatchProcessingPage';
import { AssetPositionerPage } from './modules/asset-positioner/AssetPositionerPage';
import { QrScannerPage } from './modules/qr-scanner/QrScannerPage';
import { ImageEditorPage } from './modules/image-editor/ImageEditorPage';
import { ImageViewerPage } from './modules/image-viewer/ImageViewerPage';
import { DocumentViewerPage } from './modules/document-viewer/DocumentViewerPage';
import { BatchImageProcessorPage } from './modules/batch-image/BatchImageProcessorPage';
import { UnitConverterPage } from './modules/unit-converter/UnitConverterPage';
import { useAppStore } from './stores/appStore';
import type { AppModule } from './types';
import { Toolbar } from './components/Toolbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { ReactNode } from 'react';

const { Sider, Content } = Layout;

interface ModuleConfig {
  label: string;
  icon: ReactNode;
  component: ReactNode;
}

const modules: Record<AppModule, ModuleConfig> = {
  dashboard: {
    label: 'Inicio',
    icon: <HomeOutlined />,
    component: <DashboardPage />,
  },
  'pdf-editor': {
    label: 'Editor PDF',
    icon: <FilePdfOutlined />,
    component: <PdfEditorPage />,
  },
  converter: {
    label: 'Convertidor',
    icon: <SwapOutlined />,
    component: <ConverterPage />,
  },
  watermark: {
    label: 'Marca de Agua',
    icon: <BgColorsOutlined />,
    component: <WatermarkPage />,
  },
  signatures: {
    label: 'Firmas',
    icon: <EditOutlined />,
    component: <SignaturesPage />,
  },
  stamps: {
    label: 'Sellos',
    icon: <StarOutlined />,
    component: <StampsPage />,
  },
  'html-to-image': {
    label: 'Firma Correo',
    icon: <PictureOutlined />,
    component: <HtmlToImagePage />,
  },
  'pdf-tools': {
    label: 'Herramientas PDF',
    icon: <ToolOutlined />,
    component: <PdfToolsPage />,
  },
  ocr: {
    label: 'OCR',
    icon: <ScanOutlined />,
    component: <OcrPage />,
  },
  annotations: {
    label: 'Anotaciones',
    icon: <HighlightOutlined />,
    component: <AnnotationsPage />,
  },
  forms: {
    label: 'Formularios',
    icon: <FormOutlined />,
    component: <PdfFormsPage />,
  },
  'digital-signature': {
    label: 'Firma Digital',
    icon: <SafetyCertificateOutlined />,
    component: <DigitalSignaturePage />,
  },
  compare: {
    label: 'Comparar PDFs',
    icon: <SwapOutlined />,
    component: <PdfComparerPage />,
  },
  'image-extractor': {
    label: 'Extraer Imágenes',
    icon: <FileImageOutlined />,
    component: <ImageExtractorPage />,
  },
  metadata: {
    label: 'Metadatos',
    icon: <FileTextOutlined />,
    component: <MetadataEditorPage />,
  },
  redact: {
    label: 'Redactar',
    icon: <EyeInvisibleOutlined />,
    component: <RedactPage />,
  },
  compliance: {
    label: 'PDF/A',
    icon: <FileProtectOutlined />,
    component: <PdfACompliancePage />,
  },
  templates: {
    label: 'Plantillas',
    icon: <FileTextOutlined />,
    component: <TemplatesPage />,
  },
  batch: {
    label: 'Procesamiento Lote',
    icon: <PlayCircleOutlined />,
    component: <BatchProcessingPage />,
  },
  'asset-positioner': {
    label: 'Posicionar',
    icon: <EditOutlined />,
    component: <AssetPositionerPage />,
  },
  'qr-scanner': {
    label: 'Escáner QR',
    icon: <QrcodeOutlined />,
    component: <QrScannerPage />,
  },
  'image-editor': {
    label: 'Editor de Imágenes',
    icon: <ScissorOutlined />,
    component: <ImageEditorPage />,
  },
  'image-viewer': {
    label: 'Visor de Imágenes',
    icon: <AppstoreOutlined />,
    component: <ImageViewerPage />,
  },
  'document-viewer': {
    label: 'Visor de Documentos',
    icon: <FileWordOutlined />,
    component: <DocumentViewerPage />,
  },
  'batch-image': {
    label: 'Procesador de Imágenes',
    icon: <FileImageOutlined />,
    component: <BatchImageProcessorPage />,
  },
  'unit-converter': {
    label: 'Conversor de Unidades',
    icon: <SwapOutlined />,
    component: <UnitConverterPage />,
  },
};

const lightThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
  },
};

const darkThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorBgBase: '#000000',
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#000000',
    colorBgSpotlight: '#262626',
    colorBorder: '#303030',
    colorBorderSecondary: '#424242',
    colorText: '#ffffff',
    colorTextQuaternary: '#ffffff4d',
    colorTextTertiary: '#ffffff73',
    colorTextSecondary: '#ffffffb3',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
  },
  algorithm: theme.darkAlgorithm,
  components: {
    Layout: {
      headerBg: '#141414',
      bodyBg: '#000000',
      siderBg: '#141414',
    },
    Menu: {
      darkItemBg: '#141414',
      darkSubItemBg: '#1f1f1f',
      darkItemSelectedBg: '#262626',
      darkItemHoverBg: '#262626',
    },
    Card: {
      colorBgContainer: '#141414',
    },
    Input: {
      colorBg: '#1f1f1f',
      colorBorder: '#303030',
    },
    Button: {
      primaryShadow: '0 2px 4px rgba(0,0,0,0)',
    },
  },
};

function App() {
  const store = useAppStore();
  const activeModule = store.activeModule as AppModule;
  const setActiveModule = store.setActiveModule;
  const themeMode = store.theme;

  const CurrentModule = modules[activeModule]?.component;

  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'Inicio',
    },
    {
      key: 'sub-edition',
      icon: <EditOutlined />,
      label: 'Edición & Creación',
      children: [
        { key: 'pdf-editor', icon: <FilePdfOutlined />, label: 'Editor PDF' },
        { key: 'image-editor', icon: <ScissorOutlined />, label: 'Editor de Imágenes' },
        { key: 'annotations', icon: <HighlightOutlined />, label: 'Anotaciones' },
        { key: 'forms', icon: <FormOutlined />, label: 'Formularios' },
        { key: 'templates', icon: <FileTextOutlined />, label: 'Plantillas' },
      ],
    },
    {
      key: 'sub-security',
      icon: <SafetyCertificateOutlined />,
      label: 'Seguridad',
      children: [
        { key: 'redact', icon: <EyeInvisibleOutlined />, label: 'Redactar' },
        { key: 'signatures', icon: <EditOutlined />, label: 'Firmas' },
        { key: 'digital-signature', icon: <SafetyCertificateOutlined />, label: 'Firma Digital' },
        { key: 'stamps', icon: <StarOutlined />, label: 'Sellos' },
        { key: 'watermark', icon: <BgColorsOutlined />, label: 'Marca de Agua' },
      ],
    },
    {
      key: 'sub-processing',
      icon: <SwapOutlined />,
      label: 'Procesamiento',
      children: [
        { key: 'image-extractor', icon: <FileImageOutlined />, label: 'Extraer Imágenes' },
        { key: 'converter', icon: <SwapOutlined />, label: 'Convertidor' },
        { key: 'ocr', icon: <ScanOutlined />, label: 'OCR' },
        { key: 'batch', icon: <PlayCircleOutlined />, label: 'Procesamiento Lote' },
      ],
    },
    {
      key: 'sub-utilities',
      icon: <ToolOutlined />,
      label: 'Utilidades',
      children: [
        { key: 'metadata', icon: <FileTextOutlined />, label: 'Metadatos' },
        { key: 'compare', icon: <SwapOutlined />, label: 'Comparar PDFs' },
        { key: 'compliance', icon: <FileProtectOutlined />, label: 'Cumplimiento PDF/A' },
        { key: 'html-to-image', icon: <PictureOutlined />, label: 'Firma Correo' },
        { key: 'pdf-tools', icon: <ToolOutlined />, label: 'Herramientas PDF' },
        { key: 'qr-scanner', icon: <QrcodeOutlined />, label: 'Escáner QR' },
        { key: 'image-viewer', icon: <AppstoreOutlined />, label: 'Visor de Imágenes' },
        { key: 'document-viewer', icon: <FileWordOutlined />, label: 'Visor Documentos' },
        { key: 'batch-image', icon: <FileImageOutlined />, label: 'Procesador Imágenes' },
        { key: 'unit-converter', icon: <CalculatorOutlined />, label: 'Conversor Unidades' },
      ],
    },
  ];

  const currentTheme = themeMode === 'dark' ? darkThemeConfig : lightThemeConfig;

  return (
    <ErrorBoundary>
      <ConfigProvider theme={currentTheme as any}>
        <Layout style={{ minHeight: '100vh' }} data-theme={themeMode}>
          <Sider
            width={200}
            theme={themeMode as "light" | "dark"}
            style={{
              borderRight: `1px solid ${themeMode === 'dark' ? '#303030' : '#f0f0f0'}`,
            }}
          >
            <div
              style={{
                padding: 16,
                fontSize: 16,
                fontWeight: 'bold',
                borderBottom: `1px solid ${themeMode === 'dark' ? '#303030' : '#f0f0f0'}`,
                textAlign: 'center',
                color: themeMode === 'dark' ? '#fff' : 'inherit',
              }}
            >
              PDF Toolkit
            </div>
            <Menu
              mode="inline"
              selectedKeys={[activeModule]}
              items={menuItems}
              onClick={({ key }) => {
                useAppStore.getState().setLastModule(activeModule as AppModule);
                setActiveModule(key as AppModule);
              }}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
          <Layout>
            <Toolbar />
            <Content style={{ padding: 24, background: 'var(--ant-color-bg-layout)', overflow: 'auto' }}>
              {CurrentModule}
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;