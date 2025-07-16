import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTeacherClass, removeStudent, deleteClass } from '../api/teacher';
import {
  Breadcrumb,
  Card,
  Button,
  Descriptions,
  Collapse,
  Table,
  Space,
  Input,
  Affix,
  message,
} from 'antd';
import { EyeOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import '../index.css';

export default function TeacherClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const data = await fetchTeacherClass(cid);
      setInfo(data);
    } catch (err) {
      setInfo(null);
    }
  };

  useEffect(() => {
    load();
  }, [cid]);

  const handleRemove = async (sid) => {
    if (!window.confirm('确认删除该学生吗？')) return;
    try {
      await removeStudent(cid, sid);
      load();
      message.success('已删除');
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleDisband = async () => {
    if (!window.confirm('确认解散该班级吗？')) return;
    try {
      await deleteClass(cid);
      navigate(-1);
      message.success('班级已解散');
    } catch (err) {
      message.error('解散失败');
    }
  };

  if (!info) {
    return (
      <div className="container">
        <div className="card">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ alignItems: 'stretch' }}>
      <Breadcrumb
        items={[
          { title: '首页', href: '/teacher/lesson' },
          { title: '班级管理', href: '/teacher/classes' },
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

        <Collapse defaultActiveKey={['students']} style={{ marginTop: '1rem' }}>
          <Collapse.Panel header="学生列表" key="students">
            <Input.Search
              placeholder="搜索学生"
              onSearch={setSearch}
              style={{ marginBottom: '1rem' }}
              allowClear
            />
            <Table
              rowKey="id"
              dataSource={info.students.filter((s) =>
                s.username.includes(search)
              )}
              pagination={false}
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  sorter: (a, b) => a.id - b.id,
                },
                {
                  title: '用户名',
                  dataIndex: 'username',
                  sorter: (a, b) => a.username.localeCompare(b.username),
                },
                {
                  title: '操作',
                  render: (_, record) => (
                    <Space className="actions-cell">
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/teacher/students/${record.id}?cid=${cid}`)}
                      />
                      <Button
                        type="link"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(record.id)}
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </Collapse.Panel>
          <Collapse.Panel header="作业统计" key="stats">
            <p>暂无数据</p>
          </Collapse.Panel>
          <Collapse.Panel header="设置" key="settings">
            <p>设置项...</p>
          </Collapse.Panel>
        </Collapse>
      </Card>
      <Affix offsetBottom={20} style={{ position: 'fixed', right: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button danger onClick={handleDisband}>
            解散班级
          </Button>
        </Space>
      </Affix>
    </div>
  );
}
