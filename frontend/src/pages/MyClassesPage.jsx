import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Text,
  Tag,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import { fetchMyClasses, joinClass } from '../api/student';
import '../index.css';

export default function MyClassesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyClasses();
      setList(data);
    } catch {
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
      toast({ title: '加入成功', status: 'success', position: 'top' });
    } catch {
      toast({ title: '加入失败', status: 'error', position: 'top' });
    }
  };

  return (
    <div className="container">
      <Box className="card">
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
        <Heading size="lg">我的班级</Heading>
        <Button size="sm" colorScheme="teal" onClick={() => setShowJoin(!showJoin)}>
          加入班级
        </Button>
      </Flex>

      {showJoin && (
        <Flex gap={2} mb={4} flexWrap="wrap">
          <Input
            placeholder="班级ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            width="auto"
          />
          <Button size="sm" onClick={handleJoin} colorScheme="teal">
            提交
          </Button>
        </Flex>
      )}

      {error && (
        <Text color="red.500" mb={2}>
          {error}
        </Text>
      )}

      {loading ? (
        <Text>加载中...</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          {list.map((c) => (
            <Box
              key={c.id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)', borderColor: 'teal.400' }}
              transition="all 0.2s"
            >
              <Heading size="md" mb={2}>
                {c.name}
              </Heading>
              <Tag colorScheme="blue" mr={2} mb={2}>{c.subject}</Tag>
              <Text fontSize="sm" mb={2}>学生人数：{c.student_count}</Text>
              <Button
                leftIcon={<ViewIcon />}
                size="sm"
                onClick={() => navigate(`/student/classes/${c.id}`)}
              >
                查看
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      )}
      </Box>
    </div>
  );
}
