import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeacherClasses, createClass } from '../api/teacher';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  InputNumber,
  Pagination,
  Space,
  Form,
  Input,
  Modal,
  Spin,
  message,
} from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import '../index.css';

const subjects = ['语文','数学','英语','物理','化学','地理','生物','历史','政治'];

export default function ClassManagementPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [filterSubject, setFilterSubject] = useState('全部');
  const [minCount, setMinCount] = useState();
  const [maxCount, setMaxCount] = useState();
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTeacherClasses();
      setList(data);
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      await createClass({ name, subject });
      setShowForm(false);
      setName('');
      setSubject(subjects[0]);
      await load();
      message.success('创建成功');
    } catch (err) {
      message.error('创建失败');
    }
  };

  const filteredList = list
    .filter((c) => filterSubject === '全部' || c.subject === filterSubject)
    .filter(
      (c) =>
        (minCount === undefined || c.student_count >= minCount) &&
        (maxCount === undefined || c.student_count <= maxCount)
    );
  const pageList = filteredList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container">
      <div className="card" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
          <h2>班级管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>
            创建班级
          </Button>
        </Space>

        <Form
          layout="inline"
          style={{ marginTop: '1rem' }}
          onValuesChange={() => setPage(1)}
        >
          <Form.Item label="学科">
            <Select
              style={{ minWidth: 120 }}
              value={filterSubject}
              onChange={setFilterSubject}
            >
              <Select.Option value="全部">全部</Select.Option>
              {subjects.map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="人数">
            <InputNumber
              min={0}
              placeholder="最小"
              value={minCount}
              onChange={setMinCount}
            />
          </Form.Item>
          <Form.Item>
            <InputNumber
              min={0}
              placeholder="最大"
              value={maxCount}
              onChange={setMaxCount}
            />
          </Form.Item>
        </Form>

        {error && <div className="error">{error}</div>}
        {loading ? (
          <Spin />
        ) : (
          <>
            <Row gutter={[16, 16]} className="class-grid" style={{ marginTop: '1rem' }}>
              {pageList.map((c) => (
                <Col key={c.id}>
                  <Card
                    className="class-card"
                    hoverable
                    title={c.name}
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/teacher/classes/${c.id}`)}
                      >
                        查看
                      </Button>,
                    ]}
                  >
                    <p>学科：{c.subject}</p>
                    <p>学生人数：{c.student_count}</p>
                  </Card>
                </Col>
              ))}
            </Row>
            <Pagination
              style={{ marginTop: '1rem', textAlign: 'right' }}
              total={filteredList.length}
              pageSize={pageSize}
              current={page}
              onChange={setPage}
              showSizeChanger={false}
            />
          </>
        )}
      </div>
      <Modal
        title="创建班级"
        open={showForm}
        onOk={handleCreate}
        onCancel={() => setShowForm(false)}
      >
        <Form layout="vertical">
          <Form.Item label="班级名称" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Form.Item>
          <Form.Item label="学科">
            <Select value={subject} onChange={setSubject}>
              {subjects.map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
