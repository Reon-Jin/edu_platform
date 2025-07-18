import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { fetchStudentClass, leaveClass } from '../api/student';
import '../index.css';

export default function StudentClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const toast = useToast();

  const handleLeave = async () => {
    if (!window.confirm('确认退出该班级吗？')) return;
    try {
      await leaveClass(cid);
      toast({ title: '已退出班级', status: 'success', position: 'top' });
      navigate(-1);
    } catch {
      toast({ title: '退出失败', status: 'error', position: 'top' });
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
      <Box className="card" pb={20}>
      <Breadcrumb mb={4} fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/student/homeworks')}>首页</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/student/classes')}>我的班级</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{info.name}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <Box>
          <Text fontWeight="bold">班级名称</Text>
          <Text>{info.name}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">ID</Text>
          <Text>{info.id}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">学科</Text>
          <Text>{info.subject}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">学生人数</Text>
          <Text>{info.student_count}</Text>
        </Box>
      </SimpleGrid>

      <Flex gap={2} position={{ base: 'static', md: 'fixed' }} bottom={4} right={4}>
        <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="sm">
          返回
        </Button>
        <Button onClick={handleLeave} colorScheme="red" size="sm">
          退出班级
        </Button>
      </Flex>
      </Box>
    </div>
  );
}
