import { useState } from 'react';
import { Card, Button, Alert, message, Space, Tag, Input, Radio, List, Empty, Modal, Form, DatePicker, Row, Col, Divider } from 'antd';
import { FileTextOutlined, FilePdfOutlined, SaveOutlined, PlusOutlined, EditOutlined, MinusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { generateTemplatePdf } from './pdfGenerator';

export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  category: 'invoice' | 'contract' | 'report' | 'letter';
  createdAt: string;
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<PdfTemplate[]>([
    { id: '1', name: 'Factura Corporativa', description: 'Factura con tabla dinámica de servicios', category: 'invoice', createdAt: '2026-05-01' },
    { id: '2', name: 'Contrato de Servicios', description: 'Contrato con cláusulas dinámicas', category: 'contract', createdAt: '2026-05-02' },
    { id: '3', name: 'Informe Mensual', description: 'Reporte estructurado con secciones', category: 'report', createdAt: '2026-05-03' },
    { id: '4', name: 'Carta Formal', description: 'Carta con formato empresarial clásico', category: 'letter', createdAt: '2026-05-04' },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<'invoice'|'contract'|'report'|'letter'>('invoice');
  
  // Editor State
  const [editingTemplate, setEditingTemplate] = useState<PdfTemplate | null>(null);
  const [form] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const createTemplate = async () => {
    if (!newTemplateName.trim()) {
      message.warning('Ingresa un nombre para la plantilla');
      return;
    }

    setIsCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate: PdfTemplate = {
        id: `tpl-${Date.now()}`,
        name: newTemplateName,
        description: 'Plantilla personalizada',
        category: newTemplateCategory,
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      setNewTemplateName('');
      message.success('Plantilla creada exitosamente');
    } catch (err) {
      message.error('Error al crear plantilla');
    } finally {
      setIsCreating(false);
    }
  };

  const openTemplateEditor = (template: PdfTemplate) => {
    setEditingTemplate(template);
    form.resetFields();
    if (template.category === 'invoice') {
      form.setFieldsValue({ 
        date: dayjs(),
        taxRate: 16,
        items: [{ description: '', quantity: 1, unitPrice: 0 }] 
      });
    } else if (template.category === 'contract') {
      form.setFieldsValue({ 
        effectiveDate: dayjs(),
        clauses: [{ title: 'Objeto del Contrato', content: '' }]
      });
    } else if (template.category === 'report') {
      form.setFieldsValue({
        date: dayjs(),
        sections: [{ heading: 'Introducción', paragraph: '' }]
      });
    } else if (template.category === 'letter') {
      form.setFieldsValue({ date: dayjs() });
    }
  };

  const handleGeneratePdf = async (values: any) => {
    if (!editingTemplate) return;
    setIsGenerating(true);
    
    try {
      const pdfBytes = await generateTemplatePdf(editingTemplate.category, editingTemplate.name, values);
      
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${editingTemplate.name.replace(/\s+/g, '_')}_Generado.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('PDF generado y descargado exitosamente');
      setEditingTemplate(null);
    } catch (err) {
      console.error('[Templates] Error:', err);
      message.error('Error al generar plantilla');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    message.info('Plantilla eliminada');
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          Plantillas PDF Dinámicas Completas
        </Space>
      }
      extra={
        <Tag color="blue">{templates.length} plantilla(s)</Tag>
      }
    >
      <Alert
        type="info"
        message="Editor de Plantillas Avanzado"
        description="Ahora puedes generar facturas con tablas de múltiples servicios, contratos con iteración de cláusulas y reportes estructurados con paginación automática."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Filtro:</span>
          <Radio.Group value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <Radio.Button value="all">Todas</Radio.Button>
            <Radio.Button value="invoice">Facturas</Radio.Button>
            <Radio.Button value="contract">Contratos</Radio.Button>
            <Radio.Button value="report">Informes</Radio.Button>
            <Radio.Button value="letter">Cartas</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      <div style={{ marginBottom: 16, background: 'var(--ant-color-bg-layout)', padding: 16, borderRadius: 8 }}>
        <Space wrap>
          <Input
            placeholder="Nombre de la nueva plantilla"
            value={newTemplateName}
            onChange={e => setNewTemplateName(e.target.value)}
            onPressEnter={createTemplate}
            style={{ width: 250 }}
          />
          <Radio.Group value={newTemplateCategory} onChange={e => setNewTemplateCategory(e.target.value)}>
            <Radio value="invoice">Factura</Radio>
            <Radio value="contract">Contrato</Radio>
            <Radio value="report">Informe</Radio>
            <Radio value="letter">Carta</Radio>
          </Radio.Group>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={createTemplate}
            loading={isCreating}
          >
            Crear Nueva
          </Button>
        </Space>
      </div>

      {filteredTemplates.length === 0 ? (
        <Empty description="No hay plantillas en esta categoría" />
      ) : (
        <List
          dataSource={filteredTemplates}
          renderItem={(template: PdfTemplate) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => openTemplateEditor(template)}
                >
                  Llenar y Generar PDF
                </Button>,
                <Button 
                  type="link" 
                  danger
                  icon={<SaveOutlined />}
                  onClick={() => deleteTemplate(template.id)}
                >
                  Eliminar
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={template.name}
                description={
                  <>
                    {template.description}
                    <div style={{ marginTop: 4 }}>
                      <Tag color={
                        template.category === 'invoice' ? 'blue' :
                        template.category === 'contract' ? 'purple' :
                        template.category === 'report' ? 'green' : 'orange'
                      }>
                        {template.category}
                      </Tag>
                      <span style={{ marginLeft: 8, color: 'var(--ant-color-text-secondary)', fontSize: 12 }}>
                        Creada: {template.createdAt}
                      </span>
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* Editor Modal */}
      <Modal
        title={`Rellenando: ${editingTemplate?.name}`}
        open={!!editingTemplate}
        onCancel={() => setEditingTemplate(null)}
        footer={[
          <Button key="cancel" onClick={() => setEditingTemplate(null)}>
            Cancelar
          </Button>,
          <Button key="submit" type="primary" icon={<FilePdfOutlined />} loading={isGenerating} onClick={() => form.submit()}>
            Generar PDF Profesional
          </Button>,
        ]}
        width={750}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleGeneratePdf}>
          {editingTemplate?.category === 'invoice' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Nombre del Cliente" name="clientName" rules={[{ required: true }]}>
                    <Input placeholder="Ej. Empresa SA" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Nº Factura" name="invoiceNumber">
                    <Input placeholder="001" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Fecha" name="date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Divider>Servicios / Productos</Divider>
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={16} key={key} style={{ marginBottom: 8, alignItems: 'center' }}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'description']} rules={[{ required: true, message: 'Falta desc' }]} style={{ marginBottom: 0 }}>
                            <Input placeholder="Descripción del servicio..." />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Falta cant' }]} style={{ marginBottom: 0 }}>
                            <Input type="number" min={1} placeholder="Cant" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'unitPrice']} rules={[{ required: true, message: 'Falta precio' }]} style={{ marginBottom: 0 }}>
                            <Input type="number" step="0.01" prefix="$" placeholder="Precio" />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                        </Col>
                      </Row>
                    ))}
                    <Form.Item style={{ marginTop: 16 }}>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Agregar Ítem / Servicio
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Impuesto (% IVA, etc.)" name="taxRate">
                    <Input type="number" placeholder="Ej. 16" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {editingTemplate?.category === 'contract' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Parte A (Emisor)" name="partyA" rules={[{ required: true }]}>
                    <Input placeholder="Nombre de la empresa o persona" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Parte B (Receptor)" name="partyB" rules={[{ required: true }]}>
                    <Input placeholder="Nombre del cliente o contratista" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Fecha Efectiva" name="effectiveDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Divider>Cláusulas del Contrato</Divider>
              <Form.List name="clauses">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card size="small" key={key} style={{ marginBottom: 16 }} extra={<MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />}>
                        <Form.Item {...restField} label="Título de Cláusula" name={[name, 'title']} rules={[{ required: true }]}>
                          <Input placeholder="Ej. Plazo de Entrega" />
                        </Form.Item>
                        <Form.Item {...restField} label="Contenido" name={[name, 'content']} rules={[{ required: true }]}>
                          <Input.TextArea rows={3} placeholder="Detalle de la cláusula..." />
                        </Form.Item>
                      </Card>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Agregar Cláusula
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </>
          )}

          {editingTemplate?.category === 'report' && (
            <>
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item label="Autor" name="author" rules={[{ required: true }]}>
                    <Input placeholder="Nombre del autor" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Fecha" name="date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Divider>Secciones del Informe</Divider>
              <Form.List name="sections">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card size="small" key={key} style={{ marginBottom: 16 }} extra={<MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />}>
                        <Form.Item {...restField} label="Encabezado" name={[name, 'heading']} rules={[{ required: true }]}>
                          <Input placeholder="Ej. Análisis de Ventas" />
                        </Form.Item>
                        <Form.Item {...restField} label="Párrafo" name={[name, 'paragraph']} rules={[{ required: true }]}>
                          <Input.TextArea rows={4} placeholder="Escribe el contenido de esta sección..." />
                        </Form.Item>
                      </Card>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Agregar Sección
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </>
          )}

          {editingTemplate?.category === 'letter' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Nombre Remitente" name="senderName" rules={[{ required: true }]}>
                    <Input placeholder="Tu nombre" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Dirección Remitente" name="senderAddress">
                    <Input placeholder="Tu dirección o cargo" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Nombre Destinatario" name="recipientName" rules={[{ required: true }]}>
                    <Input placeholder="Nombre a quien va dirigida" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Dirección Destinatario" name="recipientAddress">
                    <Input placeholder="Dirección del destinatario" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item label="Asunto" name="subject" rules={[{ required: true }]}>
                    <Input placeholder="Motivo de la carta" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Fecha" name="date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Cuerpo de la Carta" name="body" rules={[{ required: true }]}>
                <Input.TextArea rows={6} placeholder="Escribe tu mensaje aquí..." />
              </Form.Item>
              <Form.Item label="Firma / Despedida" name="signOff">
                <Input placeholder="Nombre para la firma final" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
