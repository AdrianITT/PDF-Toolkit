import { useState } from 'react';
import { Card, Button, Upload, Alert, Form, Input, InputNumber, Select, Checkbox, Space, message, Tabs, List, Tag, Row, Col, Empty } from 'antd';
import { FormOutlined, FilePdfOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { isPdfValid } from '../../utils/pdfjs';

interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'other';
  name: string;
  label: string;
  value: string;
  options?: string[];
}

interface NewField {
  id: string;
  name: string;
  type: 'text' | 'checkbox';
  x: number;
  y: number;
  width: number;
  height: number;
}

export function PdfFormsPage() {
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [newFields, setNewFields] = useState<NewField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      if (!isPdfValid(data)) {
        message.error('El archivo no es un PDF válido');
        return false;
      }
      
      setPdfFile({ name: file.name, data });
      setNewFields([]);
      
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(data);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const extractedFields: FormField[] = fields.map((f, index) => {
        const type = f.constructor.name;
        let mappedType: FormField['type'] = 'other';
        let value = '';
        let options: string[] | undefined;

        if (type.includes('TextField')) {
          mappedType = 'text';
          value = (f as any).getText() || '';
        } else if (type.includes('CheckBox')) {
          mappedType = 'checkbox';
          value = (f as any).isChecked() ? 'true' : 'false';
        } else if (type.includes('Dropdown')) {
          mappedType = 'dropdown';
          options = (f as any).getOptions();
          value = (f as any).getSelected()[0] || '';
        } else if (type.includes('RadioGroup')) {
          mappedType = 'radio';
          options = (f as any).getOptions();
          value = (f as any).getSelected() || '';
        }

        return {
          id: `field-${index}`,
          name: f.getName(),
          label: f.getName(),
          type: mappedType,
          value,
          options,
        };
      });
      
      setFormFields(extractedFields.filter(f => f.type !== 'other'));
      message.success(`PDF cargado. Se detectaron ${extractedFields.length} campos.`);
    } catch (err) {
      console.error('[Forms] Error:', err);
      message.error('Error al cargar y leer el PDF');
    }
    return false;
  };

  const handleFieldChange = (id: string, value: string) => {
    setFormFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
  };

  const fillForm = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfFile.data);
      const form = pdfDoc.getForm();
      
      message.info('Llenando formulario...');
      
      for (const field of formFields) {
        try {
          if (field.type === 'text') {
            const textField = form.getTextField(field.name);
            textField.setText(field.value);
          } else if (field.type === 'checkbox') {
            const cbField = form.getCheckBox(field.name);
            if (field.value === 'true') cbField.check();
            else cbField.uncheck();
          } else if (field.type === 'dropdown') {
            const ddField = form.getDropdown(field.name);
            ddField.select(field.value);
          } else if (field.type === 'radio') {
            const radioField = form.getRadioGroup(field.name);
            radioField.select(field.value);
          }
        } catch (e) {
          console.warn(`Could not fill field ${field.name}`);
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name.replace('.pdf', '_filled.pdf');
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('Formulario llenado y descargado');
    } catch (err) {
      console.error('[Forms] Error:', err);
      message.error('Error al llenar el formulario');
    } finally {
      setIsProcessing(false);
    }
  };

  const addNewFieldToState = (type: 'text' | 'checkbox') => {
    setNewFields(prev => [...prev, {
      id: `nf-${Date.now()}`,
      name: `Nuevo${type === 'text' ? 'Texto' : 'Casilla'}${prev.length + 1}`,
      type,
      x: 100,
      y: 700 - (prev.length * 50),
      width: type === 'text' ? 200 : 20,
      height: type === 'text' ? 30 : 20
    }]);
  };

  const removeNewField = (id: string) => {
    setNewFields(prev => prev.filter(f => f.id !== id));
  };

  const saveNewFormFields = async () => {
    if (!pdfFile || newFields.length === 0) return;
    setIsProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfFile.data);
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      for (const f of newFields) {
        if (f.type === 'text') {
          const textField = form.createTextField(f.name);
          textField.addToPage(firstPage, { x: f.x, y: f.y, width: f.width, height: f.height });
        } else if (f.type === 'checkbox') {
          const cbField = form.createCheckBox(f.name);
          cbField.addToPage(firstPage, { x: f.x, y: f.y, width: f.width, height: f.height });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name.replace('.pdf', '_with_form.pdf');
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('Nuevos campos guardados en el PDF');
    } catch (err) {
      console.error('[Forms Create] Error:', err);
      message.error('Error al agregar campos');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <Form.Item key={field.id} label={field.label}>
            <Input
              value={field.value}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={`Ingresa ${field.label}`}
            />
          </Form.Item>
        );
      case 'dropdown':
      case 'radio':
        return (
          <Form.Item key={field.id} label={field.label}>
            <Select
              value={field.value || undefined}
              onChange={value => handleFieldChange(field.id, value)}
              placeholder={`Selecciona ${field.label}`}
            >
              {field.options?.map(opt => (
                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      case 'checkbox':
        return (
          <Form.Item key={field.id} valuePropName="checked">
            <Checkbox
              checked={field.value === 'true'}
              onChange={e => handleFieldChange(field.id, String(e.target.checked))}
            >
              {field.label}
            </Checkbox>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      title={
        <Space>
          <FormOutlined />
          Formularios PDF Interactivos
        </Space>
      }
      extra={
        <Space>
          <Upload accept=".pdf" showUploadList={false} beforeUpload={handleFileUpload}>
            <Button icon={<FilePdfOutlined />}>
              {pdfFile ? pdfFile.name : 'Subir PDF con formulario'}
            </Button>
          </Upload>
        </Space>
      }
    >
      <Alert
        type="info"
        message="Formularios PDF"
        description="Llena formularios AcroForm existentes o crea nuevos campos de formulario sobre un PDF."
        showIcon
        style={{ marginBottom: 16 }}
      />

      {!pdfFile ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <FormOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>Sube un PDF para comenzar</p>
        </div>
      ) : (
        <Tabs
          defaultActiveKey="fill"
          items={[
            {
              key: 'fill',
              label: 'Llenar Formulario Existente',
              children: (
                <>
                  <Alert
                    type="success"
                    message={`${formFields.length} campos detectados`}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  {formFields.length === 0 ? (
                    <Empty description="No se encontraron campos AcroForm en este PDF" />
                  ) : (
                    <Form layout="vertical" style={{ maxWidth: 600 }}>
                      {formFields.map(field => renderField(field))}
                      <Button type="primary" onClick={fillForm} loading={isProcessing} style={{ marginTop: 16 }}>
                        Guardar PDF Lleno
                      </Button>
                    </Form>
                  )}
                </>
              ),
            },
            {
              key: 'create',
              label: 'Crear Formulario (Nuevos Campos)',
              children: (
                <>
                  <Alert
                    type="info"
                    message="Agrega campos interactivos a tu PDF"
                    description="Los campos se añadirán a la primera página. Puedes especificar sus nombres y dimensiones."
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Space style={{ marginBottom: 16 }}>
                    <Button icon={<PlusOutlined />} onClick={() => addNewFieldToState('text')}>Agregar Campo de Texto</Button>
                    <Button icon={<PlusOutlined />} onClick={() => addNewFieldToState('checkbox')}>Agregar Casilla (Checkbox)</Button>
                  </Space>

                  <List
                    dataSource={newFields}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button danger size="small" onClick={() => removeNewField(item.id)}>Quitar</Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Tag color={item.type === 'text' ? 'blue' : 'green'}>{item.type.toUpperCase()}</Tag>}
                          description={
                            <Row gutter={8} style={{ marginTop: 8 }}>
                              <Col span={6}>
                                <Input 
                                  value={item.name} 
                                  onChange={e => setNewFields(prev => prev.map(f => f.id === item.id ? { ...f, name: e.target.value } : f))}
                                  addonBefore="Nombre"
                                />
                              </Col>
                              <Col span={4}>
                                <InputNumber 
                                  value={item.x} 
                                  onChange={v => setNewFields(prev => prev.map(f => f.id === item.id ? { ...f, x: v || 0 } : f))}
                                  addonBefore="X"
                                />
                              </Col>
                              <Col span={4}>
                                <InputNumber 
                                  value={item.y} 
                                  onChange={v => setNewFields(prev => prev.map(f => f.id === item.id ? { ...f, y: v || 0 } : f))}
                                  addonBefore="Y"
                                />
                              </Col>
                              <Col span={4}>
                                <InputNumber 
                                  value={item.width} 
                                  onChange={v => setNewFields(prev => prev.map(f => f.id === item.id ? { ...f, width: v || 0 } : f))}
                                  addonBefore="W"
                                />
                              </Col>
                              <Col span={4}>
                                <InputNumber 
                                  value={item.height} 
                                  onChange={v => setNewFields(prev => prev.map(f => f.id === item.id ? { ...f, height: v || 0 } : f))}
                                  addonBefore="H"
                                />
                              </Col>
                            </Row>
                          }
                        />
                      </List.Item>
                    )}
                  />

                  {newFields.length > 0 && (
                    <Button type="primary" icon={<SaveOutlined />} onClick={saveNewFormFields} loading={isProcessing} style={{ marginTop: 16 }}>
                      Guardar PDF con Nuevos Campos
                    </Button>
                  )}
                </>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}
