import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Select,
  InputNumber,
  Typography,
  Divider,
  message,
  Spin,
  Empty,
  Alert,
} from 'antd';
import {
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const API_KEY = 'LZqR8x2w0fG4D2vPvlAPdtdLkdZgBJECJmmo6TEp';
const API_URL = 'https://api.api-ninjas.com/v1/unitconversion';

interface ConversionResult {
  type: string;
  unit: string;
  amount: number;
  conversions: Record<string, number>;
}

interface MeasurementType {
  value: string;
  label: string;
  units: { value: string; label: string }[];
}

const MEASUREMENT_TYPES: MeasurementType[] = [
  {
    value: 'length',
    label: 'Longitud',
    units: [
      { value: 'meter', label: 'Metro' },
      { value: 'kilometer', label: 'Kilómetro' },
      { value: 'centimeter', label: 'Centímetro' },
      { value: 'millimeter', label: 'Milímetro' },
      { value: 'micrometer', label: 'Micrómetro' },
      { value: 'nanometer', label: 'Nanómetro' },
      { value: 'mile', label: 'Milla' },
      { value: 'yard', label: 'Yarda' },
      { value: 'foot', label: 'Pie' },
      { value: 'inch', label: 'Pulgada' },
      { value: 'nautical_mile', label: 'Milla náutica' },
      { value: 'furlong', label: 'Furlong' },
      { value: 'light_year', label: 'Año luz' },
      { value: 'astronomical_unit', label: 'Unidad astronómica' },
    ],
  },
  {
    value: 'volume',
    label: 'Volumen',
    units: [
      { value: 'cubic_meter', label: 'Metro cúbico' },
      { value: 'liter', label: 'Litro' },
      { value: 'milliliter', label: 'Mililitro' },
      { value: 'gallon', label: 'Galón' },
      { value: 'quart', label: 'Cuarto' },
      { value: 'pint', label: 'Pinta' },
      { value: 'cup', label: 'Taza' },
      { value: 'fluid_ounce', label: 'Onza líquida' },
      { value: 'tablespoon', label: 'Cucharada' },
      { value: 'teaspoon', label: 'Cucharadita' },
      { value: 'cubic_foot', label: 'Pie cúbico' },
      { value: 'cubic_inch', label: 'Pulgada cúbica' },
      { value: 'cubic_centimeter', label: 'Centímetro cúbico' },
      { value: 'cubic_millimeter', label: 'Milímetro cúbico' },
    ],
  },
  {
    value: 'area',
    label: 'Área',
    units: [
      { value: 'square_meter', label: 'Metro cuadrado' },
      { value: 'square_kilometer', label: 'Kilómetro cuadrado' },
      { value: 'square_centimeter', label: 'Centímetro cuadrado' },
      { value: 'square_millimeter', label: 'Milímetro cuadrado' },
      { value: 'square_mile', label: 'Milla cuadrada' },
      { value: 'square_yard', label: 'Yarda cuadrada' },
      { value: 'square_foot', label: 'Pie cuadrado' },
      { value: 'square_inch', label: 'Pulgada cuadrada' },
      { value: 'acre', label: 'Acre' },
      { value: 'hectare', label: 'Hectárea' },
    ],
  },
  {
    value: 'temperature',
    label: 'Temperatura',
    units: [
      { value: 'celsius', label: 'Celsius (°C)' },
      { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
      { value: 'kelvin', label: 'Kelvin (K)' },
    ],
  },
  {
    value: 'weight',
    label: 'Peso',
    units: [
      { value: 'kilogram', label: 'Kilogramo' },
      { value: 'gram', label: 'Gramo' },
      { value: 'milligram', label: 'Miligramo' },
      { value: 'metric_ton', label: 'Tonelada métrica' },
      { value: 'pound', label: 'Libra' },
      { value: 'ounce', label: 'Onza' },
      { value: 'stone', label: 'Stone' },
      { value: 'us_ton', label: 'Tonelada US' },
      { value: 'imperial_ton', label: 'Tonelada imperial' },
      { value: 'carat', label: 'Quilate' },
    ],
  },
  {
    value: 'time',
    label: 'Tiempo',
    units: [
      { value: 'second', label: 'Segundo' },
      { value: 'millisecond', label: 'Milisegundo' },
      { value: 'microsecond', label: 'Microsegundo' },
      { value: 'nanosecond', label: 'Nanosegundo' },
      { value: 'minute', label: 'Minuto' },
      { value: 'hour', label: 'Hora' },
      { value: 'day', label: 'Día' },
      { value: 'week', label: 'Semana' },
      { value: 'month', label: 'Mes' },
      { value: 'year', label: 'Año' },
      { value: 'decade', label: 'Década' },
      { value: 'century', label: 'Siglo' },
    ],
  },
  {
    value: 'speed',
    label: 'Velocidad',
    units: [
      { value: 'meter_per_second', label: 'Metro por segundo' },
      { value: 'kilometer_per_hour', label: 'Kilómetro por hora' },
      { value: 'mile_per_hour', label: 'Milla por hora' },
      { value: 'knot', label: 'Nudo' },
      { value: 'foot_per_second', label: 'Pie por segundo' },
    ],
  },
  {
    value: 'force',
    label: 'Fuerza',
    units: [
      { value: 'newton', label: 'Newton' },
      { value: 'kilonewton', label: 'Kilonewton' },
      { value: 'pound_force', label: 'Libra fuerza' },
      { value: 'dyne', label: 'Dina' },
    ],
  },
  {
    value: 'power',
    label: 'Potencia',
    units: [
      { value: 'watt', label: 'Vatio' },
      { value: 'kilowatt', label: 'Kilovatio' },
      { value: 'megawatt', label: 'Megavatio' },
      { value: 'horsepower', label: 'Caballo de fuerza' },
      { value: 'btu_per_hour', label: 'BTU/hora' },
    ],
  },
  {
    value: 'pressure',
    label: 'Presión',
    units: [
      { value: 'pascal', label: 'Pascal' },
      { value: 'kilopascal', label: 'Kilopascal' },
      { value: 'megapascal', label: 'Megapascal' },
      { value: 'bar', label: 'Bar' },
      { value: 'psi', label: 'PSI' },
      { value: 'atmosphere', label: 'Atmósfera' },
      { value: 'torr', label: 'Torr' },
      { value: 'millimeter_of_mercury', label: 'mmHg' },
    ],
  },
  {
    value: 'energy',
    label: 'Energía',
    units: [
      { value: 'joule', label: 'Julio' },
      { value: 'kilojoule', label: 'Kilojulio' },
      { value: 'calorie', label: 'Caloría' },
      { value: 'kilocalorie', label: 'Kilocaloría' },
      { value: 'watt_hour', label: 'Vatio hora' },
      { value: 'kilowatt_hour', label: 'Kilovatio hora' },
      { value: 'electron_volt', label: 'Electronvoltio' },
      { value: 'british_thermal_unit', label: 'BTU' },
      { value: 'us_therm', label: 'Therm US' },
      { value: 'foot_pound', label: 'Pie-libra' },
    ],
  },
];

export function UnitConverterPage() {
  const [measurementType, setMeasurementType] = useState('length');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('meter');
  const [results, setResults] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMeasurement = MEASUREMENT_TYPES.find(m => m.value === measurementType);
  const currentUnits = currentMeasurement?.units || [];

  const handleMeasurementTypeChange = (val: string) => {
    setMeasurementType(val);
    const type = MEASUREMENT_TYPES.find(m => m.value === val);
    if (type && type.units.length > 0) {
      setUnit(type.units[0].value);
    }
    setResults(null);
    setError(null);
  };

  const handleConvert = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(
        `${API_URL}?amount=${amount}&unit=${unit}`,
        {
          headers: { 'X-Api-Key': API_KEY },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Key inválida');
        }
        if (response.status === 429) {
          throw new Error('Límite de requests excedido. Intenta más tarde.');
        }
        throw new Error('Error en la conversión');
      }

      const data = await response.json();
      setResults(data);
      message.success('Conversión realizada');
    } catch (err: any) {
      setError(err.message || 'Error al convertir');
      message.error(err.message || 'Error al convertir');
    } finally {
      setIsLoading(false);
    }
  }, [amount, unit]);

  const handleClear = () => {
    setResults(null);
    setError(null);
    setAmount(1);
    const type = MEASUREMENT_TYPES.find(m => m.value === measurementType);
    if (type) setUnit(type.units[0].value);
  };

  const handleCopy = () => {
    if (!results) return;

    const text = `${results.amount} ${results.unit} = \n` +
      Object.entries(results.conversions)
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n');

    navigator.clipboard.writeText(text);
    message.success('Resultados copiados');
  };

  const formatValue = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return value.toExponential(4);
    }
    if (Math.abs(value) < 0.0001 && value !== 0) {
      return value.toExponential(4);
    }
    return parseFloat(value.toPrecision(6)).toString();
  };

  const getUnitLabel = (unitValue: string): string => {
    const unit = currentUnits.find(u => u.value === unitValue);
    return unit?.label || unitValue;
  };

  return (
    <Card
      title={
        <span>
          <SwapOutlined style={{ marginRight: 8 }} />
          Conversor de Unidades
        </span>
      }
      extra={
        <Button icon={<ClearOutlined />} onClick={handleClear}>
          Limpiar
        </Button>
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Configuración" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Tipo de medida:
                </Text>
                <Select
                  value={measurementType}
                  onChange={handleMeasurementTypeChange}
                  style={{ width: '100%' }}
                  options={MEASUREMENT_TYPES.map(m => ({
                    value: m.value,
                    label: m.label,
                  }))}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Valor:
                </Text>
                <InputNumber
                  value={amount}
                  onChange={(val) => setAmount(val || 1)}
                  style={{ width: '100%' }}
                  min={0}
                  step={measurementType === 'temperature' ? 0.1 : 1}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Unidad:
                </Text>
                <Select
                  value={unit}
                  onChange={(val) => {
                    setUnit(val);
                    setResults(null);
                    setError(null);
                  }}
                  style={{ width: '100%' }}
                  options={currentUnits.map(u => ({
                    value: u.value,
                    label: u.label,
                  }))}
                />
              </div>

              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={handleConvert}
                loading={isLoading}
                block
                size="large"
              >
                {isLoading ? 'Convirtiendo...' : 'Convertir'}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            size="small" 
            title="Resultados"
            extra={
              results && (
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  size="small"
                >
                  Copiar
                </Button>
              )
            }
          >
            {isLoading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                  Convirtiendo...
                </Text>
              </div>
            )}

            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
              />
            )}

            {!isLoading && !error && !results && (
              <Empty
                description="Ingresa un valor y haz clic en Convertir"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            {!isLoading && !error && results && (
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {results.amount} {getUnitLabel(results.unit)} =
                </Text>
                <Divider style={{ margin: '12px 0' }} />
                <Space direction="vertical" style={{ width: '100%' }}>
                  {Object.entries(results.conversions).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">{getUnitLabel(key)}:</Text>
                      <Text strong>{formatValue(value)}</Text>
                    </div>
                  ))}
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}