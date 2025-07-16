import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyClasses, joinClass } from '../api/student';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Spin,
  message,
  Pagination,
} from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import '../index.css';

export default function MyClassesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyClasses();
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

  const handleJoin = async () => {
    try {
      await joinClass(Number(joinId));
      setShowJoin(false);
      setJoinId('');
      load();
      message.success('加入成功');
    } catch (err) {
      message.error('加入失败');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
          <h2>我的班级</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowJoin(true)}>
            加入班级
          </Button>
        </Space>

        {error && <div className="error">{error}</div>}
        {loading ? (
          <Spin style={{ marginTop: '1rem' }} />
        ) : (
          <>
            <Row gutter={[16,16]} className="class-grid" style={{ marginTop: '1rem' }}>
              {list.slice((page-1)*pageSize, page*pageSize).map((c) => (
                <Col key={c.id}>
                  <Card
                    className="class-card"
                    hoverable
                    title={c.name}
                    actions={[
                      <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/student/classes/${c.id}`)}>
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
              total={list.length}
              pageSize={pageSize}
              current={page}
              onChange={setPage}
              showSizeChanger={false}
            />
          </>
        )}
      </div>
      <Modal
        title="加入班级"
        open={showJoin}
        onOk={handleJoin}
        onCancel={() => setShowJoin(false)}
      >
        <Form layout="vertical">
          <Form.Item label="班级ID" required>
            <Input value={joinId} onChange={(e) => setJoinId(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
