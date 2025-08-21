import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Text,
  useToast,
  Tag,
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import { fetchTeacherClasses, createClass } from '../api/teacher';
import '../index.css';

const subjects = ['语文','数学','英语','物理','化学','地理','生物','历史','政治'];

export default function ClassManagementPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [minCount, setMinCount] = useState('');
  const [maxCount, setMaxCount] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const toast = useToast();

  // —— 可复用样式 —— //
  const blueGlassBtn = {
    bg: 'rgba(0, 30, 80, 0.9)',
    color: 'white',
    border: '1px solid rgba(120,150,255,0.25)',
    backdropFilter: 'blur(6px)',
    _hover: {
      bg: 'rgba(0, 50, 120, 0.7)',
      boxShadow: '0 0 12px rgba(0,150,255,0.35)',
    },
    _active: { bg: 'rgba(0, 30, 80, 0.8)' },
  };

  const darkSelect = {
    bg: 'rgba(10,20,40,0.7)',
    color: 'white',
    border: '1px solid rgba(120,150,255,0.25)',
    iconColor: 'rgba(183,206,255,0.9)',           // 下拉小箭头颜色
    _hover: { borderColor: 'rgba(83,164,255,0.45)' },
    _focus: {
      borderColor: 'rgba(83,164,255,0.65)',
      boxShadow: '0 0 0 4px rgba(83,164,255,0.15)',
    },
    // ✅ 大多数浏览器可用：控制 option 的背景与文字
    sx: {
      option: { background: '#0b1526', color: '#fff' },
      'option:disabled': { color: 'rgba(255,255,255,0.5)' },
    },
  };

  const darkInput = {
    bg: 'rgba(10,20,40,0.7)',
    color: 'white',
    border: '1px solid rgba(120,150,255,0.25)',
    _placeholder: { color: 'rgba(233,238,247,0.55)' },
    _hover: { borderColor: 'rgba(83,164,255,0.45)' },
    _focus: {
      borderColor: 'rgba(83,164,255,0.65)',
      boxShadow: '0 0 0 4px rgba(83,164,255,0.15)',
    },
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTeacherClasses();
      setList(data);
    } catch (err) {
      console.error(err);
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
      toast({ title: '创建成功', status: 'success', position: 'top' });
    } catch (err) {
      console.error(err);
      toast({ title: '创建失败', status: 'error', position: 'top' });
    }
  };

  const filtered = list.filter(c =>
    (!subjectFilter || c.subject === subjectFilter) &&
    (!minCount || c.student_count >= Number(minCount)) &&
    (!maxCount || c.student_count <= Number(maxCount))
  );
  const pageSize = 6;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container">
      <Box className="card">
        <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
          <Heading size="lg">班级管理</Heading>

          {/* 创建班级按钮：深蓝玻璃 */}
          <Button onClick={() => setShowForm(!showForm)} size="sm" {...blueGlassBtn}>
            创建班级
          </Button>
        </Flex>

        {showForm && (
          <Flex gap={2} mb={4} flexWrap="wrap">
            <Input
              placeholder="班级名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              width="auto"
              {...darkInput}
            />
            <Select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              width="auto"
              {...darkSelect}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>

            {/* 提交按钮：与“创建班级”一致 */}
            <Button onClick={handleCreate} size="sm" alignSelf="flex-end" {...blueGlassBtn}>
              提交
            </Button>
          </Flex>
        )}

        <Flex gap={2} mb={4} flexWrap="wrap">
          <Select
            placeholder="学科"
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
            width="auto"
            {...darkSelect}
          >
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>

          <Input
            placeholder="人数下限"
            type="number"
            value={minCount}
            onChange={(e)=>{setMinCount(e.target.value); setPage(1);}}
            width="auto"
            {...darkInput}
          />
          <Input
            placeholder="人数上限"
            type="number"
            value={maxCount}
            onChange={(e)=>{setMaxCount(e.target.value); setPage(1);}}
            width="auto"
            {...darkInput}
          />
        </Flex>

        {error && <Text color="red.400" mb={2}>{error}</Text>}

        {loading ? (
          <Text>加载中...</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
            {paged.map((c) => (
              <Box
                key={c.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)', borderColor: 'teal.400' }}
                transition="all 0.2s"
              >
                <Heading size="md" mb={2}>{c.name}</Heading>
                <Tag
                bg="rgba(51, 177, 255, 0.25)"   // 半透明蓝底
                color="white"                   // 白色文字
                border="1px solid rgba(51,177,255,0.4)"
                borderRadius="md"
                px={2}
                py={1}
                fontSize="sm"
                >
                {c.subject}
                </Tag>

                <Text fontSize="sm" mb={2}>学生人数：{c.student_count}</Text>
                <Button
                leftIcon={<ViewIcon color="black" />}   // 图标固定黑色
                size="sm"
                onClick={() => navigate(`/teacher/classes/${c.id}`)}
                >
                查看
                </Button>

              </Box>
            ))}
          </SimpleGrid>
        )}

        <Flex mt={4} justify="center" gap={2}>
          <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page === 1}>
            上一页
          </Button>
          <Text alignSelf="center" fontSize="sm">
            {page}/{totalPages}
          </Text>
          <Button size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} isDisabled={page === totalPages}>
            下一页
          </Button>
        </Flex>
      </Box>
    </div>
  );
}
