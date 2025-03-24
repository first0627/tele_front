import {useCallback, useEffect, useMemo, useState} from 'react';
import {DataGrid, useGridApiRef} from '@mui/x-data-grid';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import dayjs from 'dayjs';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

function App() {
  const [rows, setRows] = useState([]);
  const [channels, setChannels] = useState([]);
  const [newUrlId, setNewUrlId] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [channelLoading, setChannelLoading] = useState(false);

  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:1024px)');

  const apiRef = useGridApiRef();

  const dates = useMemo(() => {
    return Array.from({length: 12}, (_, i) =>
        dayjs().subtract(11 - i, 'day').format('YYYY-MM-DD'),
    );
  }, []);

  const columns = useMemo(() => [
    {
      field: 'channel',
      headerName: '',
      minWidth: 120,
      flex: 2.25,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => {
        const row = params.row;
        if (row.type === 'main') {
          return (
              <Link
                  href={row.url}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                  style={{
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'inline-block',
                    maxWidth: '100%',
                  }}
              >
                {params.value}
              </Link>
          );
        }
        return (
            <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block',
                  maxWidth: '100%',
                }}
            >
            {params.value}
          </span>
        );
      },
      cellClassName: 'channel-cell',
    },
    ...dates.slice(1).map((date) => ({
      field: date,
      headerName: dayjs(date).format('M / D'),
      minWidth: isMobile ? 80 : 100,
      flex: isMobile ? undefined : 0.5,
      headerAlign: 'center',
      align: 'right',
      renderCell: (params) => {
        const {row, value} = params;
        if (row.type === 'main') {
          return (
              <span style={{color: 'black'}}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          );
        }
        if (row.type === 'diff') {
          const color = value > 0 ? 'red' : value < 0 ? 'blue' : 'black';
          return (
              <span style={{color}}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          );
        }
        if (row.type === 'rate') {
          const num = parseFloat((value || '0').toString().replace('%', ''));
          const color = num > 0 ? 'red' : num < 0 ? 'blue' : 'black';
          return (
              <span style={{color}}>
              {value}
            </span>
          );
        }
        return value ?? '-';
      },
    })),
    {
      field: 'avgDiff',
      headerName: '총 증감',
      minWidth: isMobile ? 80 : 100,
      flex: isMobile ? undefined : 0.6,
      headerAlign: 'center',
      align: 'right',
      renderCell: ({row, value}) => {
        if (row.type !== 'main') return null;
        const num = parseInt((value || '0').toString().replace(/,/g, ''), 10);
        const color = num > 0 ? 'red' : num < 0 ? 'blue' : 'black';
        return (
            <span style={{color}}>
        {num.toLocaleString()}
      </span>
        );
      },
    },
    {
      field: 'avgRate',
      headerName: '총 증감률',
      minWidth: isMobile ? 80 : 100,
      flex: isMobile ? undefined : 0.6,
      headerAlign: 'center',
      align: 'right',
      renderCell: ({row, value}) => {
        if (row.type !== 'main') return null;
        const num = parseFloat((value || '0').toString().replace('%', ''));
        const color = num > 0 ? 'red' : num < 0 ? 'blue' : 'black';
        return (
            <span style={{color}}>
        {value}
      </span>
        );
      },
      headerClassName: 'nowrap-header',
    },
  ], [dates, isMobile]);

  const processData = useCallback((data) => {
    const groupedData = data.reduce((acc, item) => {
      const {channelName, channelUrl, date, subscriberCount} = item;
      if (!acc[channelName]) {
        acc[channelName] = {
          channel: channelName,
          url: channelUrl,
          counts: {},
        };
      }
      acc[channelName].counts[date] = subscriberCount;
      return acc;
    }, {});

    return Object.values(groupedData).flatMap((row, index) => {
      const counts = row.counts;
      let totalDiff = 0;
      let totalRate = 0;
      let diffCount = 0;

      const mainRow = {
        id: `${index + 1}-main`,
        type: 'main',
        channel: row.channel,
        url: row.url,
      };
      const diffRow = {
        id: `${index + 1}-diff`,
        type: 'diff',
        channel: '증감',
      };
      const rateRow = {
        id: `${index + 1}-rate`,
        type: 'rate',
        channel: '증감률',
      };

      dates.slice(1).forEach((date, idx) => {
        const today = counts[date] || 0;
        const yesterday = counts[dates[idx]] || 0;

        if (yesterday !== 0) {
          const diff = today - yesterday;
          const rate = ((diff / yesterday) * 100).toFixed(2);
          totalDiff += diff;
          totalRate += parseFloat(rate);
          diffCount++;

          diffRow[date] = diff;
          rateRow[date] = `${rate}%`;
        } else {
          diffRow[date] = '-';
          rateRow[date] = '-';
        }

        mainRow[date] = today ? today : '-';
      });

      mainRow.avgDiff = totalDiff;
      mainRow.avgRate = diffCount > 0
          ? `${(totalRate / diffCount).toFixed(2)}%`
          : '0.00%';

      return [mainRow, diffRow, rateRow];
    });
  }, [dates]);

  // ✅ initialFetch 수정 (로딩 상태 추가)
  const initialFetch = useCallback(async () => {
    setLoading(true); // 로딩 시작
    try {
      const res = await axios.get(
          'https://telegram-ofu6.onrender.com/api/telegram/history',
      );
      const formattedRows = processData(res.data);
      setRows(formattedRows);
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, [processData]);

  const fetchChannels = useCallback(async () => {
    setChannelLoading(true);
    const res = await axios.get(
        'https://telegram-ofu6.onrender.com/api/channels');
    setChannels(res.data);
    setChannelLoading(false);
  }, []);

  const saveAndUpdateToday = useCallback(async () => {
    setLoading(true);
    try {
      await axios.post('https://telegram-ofu6.onrender.com/api/telegram/save');
      const res = await axios.get(
          'https://telegram-ofu6.onrender.com/api/telegram/history');
      const formattedRows = processData(res.data);
      setRows(formattedRows);
      apiRef.current.updateRows(formattedRows);
    } finally {
      setLoading(false);
    }
  }, [processData, apiRef]);

  const handleAdd = async () => {
    if (!newUrlId || isDuplicate) return;
    await axios.post('https://telegram-ofu6.onrender.com/api/channels',
        {urlId: newUrlId});
    setNewUrlId('');
    setIsDuplicate(false);
    await fetchChannels();
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('정말 삭제하시겠습니까?');
    if (!confirm) return;
    await axios.delete(`https://telegram-ofu6.onrender.com/api/channels/${id}`);
    await fetchChannels();
  };

  const handleOpen = () => {
    setOpen(true);
    fetchChannels();
  };

  useEffect(() => {
    const exists = channels.some((c) => c.urlId === newUrlId.trim());
    setIsDuplicate(exists);
  }, [newUrlId, channels]);

  useEffect(() => {
    if (!fetched) {
      initialFetch();
      setFetched(true);
    }
  }, [fetched, initialFetch]);

  const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor,
          {coordinateGetter: sortableKeyboardCoordinates}),
  );

  const handleDragEnd = async (event) => {
    const {active, over} = event;
    if (active.id !== over.id) {
      const oldIndex = channels.findIndex((c) => c.id === active.id);
      const newIndex = channels.findIndex((c) => c.id === over.id);
      const newChannels = arrayMove(channels, oldIndex, newIndex);
      setChannels(newChannels);
      reorderRows(newChannels);

      // 서버로 순서 저장
      await axios.post(
          'https://telegram-ofu6.onrender.com/api/channels/reorder', {
            orderedIds: newChannels.map((c) => c.id),
          });
    }
  };

  const reorderRows = (newChannels) => {
    const newRows = [];
    newChannels.forEach((channel) => {
      const mainRow = rows.find(
          (r) => r.type === 'main' && r.channel === channel.name);
      const diffRow = rows.find((r) => r.type === 'diff' &&
          r.id.startsWith(mainRow?.id.split('-')[0]));
      const rateRow = rows.find((r) => r.type === 'rate' &&
          r.id.startsWith(mainRow?.id.split('-')[0]));
      if (mainRow && diffRow && rateRow) {
        newRows.push(mainRow, diffRow, rateRow);
      }
    });
    setRows(newRows);
  };

  const SortableItem = ({channel}) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({
      id: channel.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDelete(channel.id)}>
                <DeleteIcon/>
              </IconButton>
            }
        >
          <ListItemText
              primary={`${channel.name}`}
              secondary={`/${channel.urlId}`}
          />
        </ListItem>
    );
  };
  return (
      <Container maxWidth="xl" style={{marginTop: '50px'}}>
        <Typography variant="h4" gutterBottom align="center">
          Telegram 채널 통계
        </Typography>

        <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}
             gap={1} pr={isMobile ? 1 : 3}>
          <Button
              variant="outlined"
              startIcon={<ManageAccountsIcon/>}
              onClick={handleOpen}
          >
            채널 관리
          </Button>
          <Button
              variant="contained"
              onClick={saveAndUpdateToday}
              disabled={loading}
              startIcon={loading
                  ? <CircularProgress size={20} color="inherit"/>
                  : null}
              sx={{minWidth: '120px'}}
          >
            {loading ? '업데이트 중...' : '새로고침'}
          </Button>
        </Box>


        {/* 채널 관리 모달 */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm"
                fullWidth>
          <DialogTitle>채널 관리</DialogTitle>
          <DialogContent dividers>
            {channelLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center"
                     minHeight="200px">
                  <CircularProgress/>
                </Box>
            ) : (
                <>
                  <Box display="flex" gap={1} mb={1}>
                    <TextField
                        label="URL ID (예: tazastock)"
                        size="small"
                        fullWidth
                        value={newUrlId}
                        onChange={(e) => setNewUrlId(e.target.value)}
                        error={isDuplicate}
                    />
                    <Button variant="contained" onClick={handleAdd}
                            disabled={isDuplicate || !newUrlId}>
                      추가
                    </Button>
                  </Box>
                  {isDuplicate && (
                      <FormHelperText error>이미 등록된 URL ID입니다.</FormHelperText>
                  )}
                  <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                        items={channels}
                        strategy={verticalListSortingStrategy}
                    >
                      <List>
                        {channels.map((channel) => (
                            <SortableItem key={channel.id} channel={channel}/>
                        ))}
                      </List>
                    </SortableContext>
                  </DndContext>
                </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>닫기</Button>
          </DialogActions>
        </Dialog>

        {/* 통계 테이블 */}
        <Box width="100%" px={isMobile ? 1 : 3}
             sx={{overflowX: isMobile ? 'auto' : 'visible'}}>
          <DataGrid
              apiRef={apiRef}
              rows={rows}
              columns={columns}
              rowHeight={30}
              getRowId={(row) => row.id}
              getRowClassName={(params) => {
                return params.row.type === 'main' ? 'channel-row' : '';
              }}
              density={isMobile ? 'compact' : isTablet
                  ? 'standard'
                  : 'comfortable'}
              disableSelectionOnClick
              disableColumnMenu
              loading={loading || !fetched}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: isMobile ? 800 : '100%',
                '& .channel-row': {backgroundColor: '#f9f9f9'},
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                  whiteSpace: 'normal',
                  wordBreak: 'keep-all',
                  textAlign: 'center',
                },
                '& .nowrap-header .MuiDataGrid-columnHeaderTitle': {
                  whiteSpace: 'nowrap',
                },
                '& .MuiDataGrid-columnHeader': {
                  whiteSpace: 'normal',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  overflow: 'visible',
                  textOverflow: 'unset',
                },
                '& .MuiDataGrid-virtualScroller': {
                  flexGrow: 1,
                },
              }}
          />
        </Box>
      </Container>
  );
}

export default App;