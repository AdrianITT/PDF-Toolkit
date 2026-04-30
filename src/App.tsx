import { ConfigProvider, Layout, Menu, theme } from 'antd';
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
import { Toolbar } from './components/Toolbar';

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

  const menuItems = Object.entries(modules).map(([key, data]) => ({
    key,
    icon: data.icon,
    label: data.label,
  }));

  const currentTheme = themeMode === 'dark' ? darkThemeConfig : lightThemeConfig;

  return (
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
            onClick={({ key }) => setActiveModule(key as AppModule)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Toolbar />
          <Content style={{ padding: 24, background: themeMode === 'dark' ? '#000000' : '#f5f5f5', overflow: 'auto' }}>
            {CurrentModule}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;