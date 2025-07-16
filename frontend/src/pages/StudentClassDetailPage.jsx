import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudentClass, leaveClass } from '../api/student';
import { Breadcrumb, Card, Button, Descriptions, Affix, Space, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import '../index.css';

export default function StudentClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);

  const handleLeave = async () => {
    if (!window.confirm('确认退出该班级吗？')) return;
    try {
      await leaveClass(cid);
      navigate(-1);
      message.success('已退出班级');
    } catch (err) {
      message.error('退出失败');
    }
  };

  useEffect(() => {
    fetchStudentClass(cid).then(setInfo).catch(() => setInfo(null));
  }, [cid]);

  if (!info) {
    return (
      <div className="container">
        <div className="card">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { title: '首页', href: '/student/homeworks' },
          { title: '我的班级', href: '/student/classes' },
          { title: info.name },
        ]}
      />
      <Card style={{ width: '100%', marginTop: '1rem' }}>
        <Descriptions title="班级信息" column={2} bordered size="middle">
          <Descriptions.Item label="名称">{info.name}</Descriptions.Item>
          <Descriptions.Item label="ID">{info.id}</Descriptions.Item>
          <Descriptions.Item label="学科">{info.subject}</Descriptions.Item>
          <Descriptions.Item label="人数">{info.student_count}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Affix offsetBottom={20} style={{ position: 'fixed', right: 24 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <Button danger onClick={handleLeave}>
            退出班级
          </Button>
        </Space>
      </Affix>
    </div>
  );
}
