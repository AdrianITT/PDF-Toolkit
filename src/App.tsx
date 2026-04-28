import { ConfigProvider, Layout, Menu } from 'antd';
import {
  FilePdfOutlined,
  BgColorsOutlined,
  EditOutlined,
  PictureOutlined,
  StarOutlined,
  SwapOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { PdfEditorPage } from './modules/pdf-editor/PdfEditorPage';
import { WatermarkPage } from './modules/watermark/WatermarkPage';
import { SignaturesPage } from './modules/signatures/SignaturesPage';
import { HtmlToImagePage } from './modules/html-to-image/HtmlToImagePage';
import { StampsPage } from './modules/stamps/StampsPage';
import { ConverterPage } from './modules/converter/ConverterPage';
import { PdfToolsPage } from './modules/pdf-tools/PdfToolsPage';
import { useAppStore } from './stores/appStore';
import type { AppModule } from './types';

const { Sider, Content } = Layout;

const modules: Record<AppModule, { label: string; icon: any; component: any }> = {
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
};

const theme = {
  token: {
    colorPrimary: '#1890ff',
  },
};

function App() {
  const { activeModule, setActiveModule } = useAppStore();

  const CurrentModule = modules[activeModule].component;

  const menuItems = Object.entries(modules).map(([key, data]) => ({
    key,
    icon: data.icon,
    label: data.label,
  }));

  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={200}
          theme="light"
          style={{
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <div
            style={{
              padding: 16,
              fontSize: 16,
              fontWeight: 'bold',
              borderBottom: '1px solid #f0f0f0',
              textAlign: 'center',
            }}
          >
            PDF Toolkit
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeModule]}
            items={menuItems}
            onClick={({ key }) => setActiveModule(key as AppModule)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
            {CurrentModule}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;