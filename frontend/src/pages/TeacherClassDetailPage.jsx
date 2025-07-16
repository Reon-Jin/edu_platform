import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  Input,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon, DeleteIcon, ArrowBackIcon, EditIcon, EmailIcon } from '@chakra-ui/icons';
import { fetchTeacherClass, removeStudent, deleteClass } from '../api/teacher';

export default function TeacherClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [search, setSearch] = useState('');
  const [asc, setAsc] = useState(true);
  const toast = useToast();

  const load = async () => {
    try {
      const data = await fetchTeacherClass(cid);
      setInfo(data);
    } catch {
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
      toast({ title: '已删除学生', status: 'success', position: 'top' });
    } catch {
      toast({ title: '删除失败', status: 'error', position: 'top' });
    }
  };

  const handleDisband = async () => {
    if (!window.confirm('确认解散该班级吗？')) return;
    try {
      await deleteClass(cid);
      toast({ title: '班级已解散', status: 'success', position: 'top' });
      navigate(-1);
    } catch {
      toast({ title: '解散失败', status: 'error', position: 'top' });
    }
  };

  if (!info) {
    return <Text p={4}>加载中...</Text>;
  }

  const students = info.students
    .filter((s) => s.username.includes(search))
    .sort((a, b) =>
      asc ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username)
    );

  return (
    <Box p={4} pb={20}>
      <Breadcrumb mb={4} fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/teacher/lesson')}>首页</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/teacher/classes')}>班级管理</BreadcrumbLink>
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

      <Accordion allowToggle defaultIndex={[0]}>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              学生列表
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Flex mb={2} gap={2} flexWrap="wrap" align="center">
              <Input
                placeholder="搜索学生"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                width="auto"
              />
              <Button size="sm" onClick={() => setAsc(!asc)}>
                {asc ? '升序' : '降序'}
              </Button>
            </Flex>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>用户名</Th>
                  <Th>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {students.map((s) => (
                  <Tr key={s.id}>
                    <Td>{s.id}</Td>
                    <Td>{s.username}</Td>
                    <Td>
                      <IconButton
                        size="sm"
                        mr={2}
                        icon={<ViewIcon />}
                        aria-label="查看作业"
                        onClick={() => navigate(`/teacher/students/${s.id}?cid=${cid}`)}
                      />
                      <IconButton
                        size="sm"
                        mr={2}
                        icon={<EmailIcon />}
                        aria-label="发送消息"
                      />
                      <IconButton
                        size="sm"
                        colorScheme="red"
                        icon={<DeleteIcon />}
                        aria-label="删除"
                        onClick={() => handleRemove(s.id)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              作业统计
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>敬请期待...</AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              设置
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>敬请期待...</AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Flex gap={2} position={{ base: 'static', md: 'fixed' }} bottom={4} right={4} mt={4}>
        <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="sm">
          返回
        </Button>
        <Button
          leftIcon={<DeleteIcon />}
          colorScheme="red"
          onClick={handleDisband}
          size="sm"
        >
          解散班级
        </Button>
        <Button leftIcon={<EditIcon />} size="sm" colorScheme="blue">
          编辑信息
        </Button>
      </Flex>
    </Box>
  );
}
