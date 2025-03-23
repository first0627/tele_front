import {useCallback, useEffect, useMemo, useState} from 'react';
import {DataGrid} from '@mui/x-data-grid';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  useMediaQuery,
} from '@mui/material';
import dayjs from 'dayjs';

function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:1024px)');

  // 날짜 계산은 useMemo로 메모이제이션
  const dates = useMemo(() => {
    return Array.from({length: 12}, (_, i) =>
        dayjs().subtract(11 - i, 'day').format('YYYY-MM-DD'),
    );
  }, []);

  // columns 정의를 useMemo로 최적화
  const columns = useMemo(() => [
    {
      field: 'channel',
      headerName: '',
      minWidth: 120,
      flex: 1.5,
      cellClassName: 'channel-cell',
    },
    ...dates.slice(1).map((date) => ({
      field: date,
      headerName: dayjs(date).format('M/D'),
      minWidth: isMobile ? 80 : 100,
      flex: isMobile ? undefined : 0.5,
      renderCell: (params) => params.value ?? '-',
    })),
    {
      field: 'avgDiff',
      headerName: '총 증감',
      minWidth: isMobile ? 80 : 100,
      flex: isMobile ? undefined : 0.6,
      renderCell: ({value}) => {
        const num = parseInt(value?.replace(/,/g, ''), 10);
        return (
            <span style={{color: num > 0 ? 'red' : num < 0 ? 'blue' : 'black'}}>
            {value}
          </span>
        );
      },
    },
    {
      field: 'avgRate',
      headerName: '총 증감률',
      minWidth: isMobile ? 80 : 100,
      flex: isMobile ? undefined : 0.6,
      renderCell: ({value}) => {
        const num = parseFloat(value?.replace('%', ''));
        return (
            <span style={{color: num > 0 ? 'red' : num < 0 ? 'blue' : 'black'}}>
            {value}
          </span>
        );
      },
      headerClassName: 'nowrap-header',
    },
  ], [dates, isMobile]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
          'https://telegram-ofu6.onrender.com/api/telegram/history');

      const groupedData = res.data.reduce((acc, item) => {
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

      const formattedRows = Object.values(groupedData).flatMap((row, index) => {
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

            diffRow[date] = (
                <span style={{
                  color: diff > 0 ? 'red' : diff < 0
                      ? 'blue'
                      : 'black',
                }}>
                {diff.toLocaleString()}
              </span>
            );
            rateRow[date] = (
                <span style={{
                  color: parseFloat(rate) > 0 ? 'red' : parseFloat(rate) < 0
                      ? 'blue'
                      : 'black',
                }}>
                {`${rate}%`}
              </span>
            );
          } else {
            diffRow[date] = '-';
            rateRow[date] = '-';
          }

          mainRow[date] = today ? today.toLocaleString() : '-';
        });

        const avgDiff = diffCount > 0 ? Math.round(totalDiff) : 0;
        const avgRate = diffCount > 0
            ? (totalRate / diffCount).toFixed(2)
            : '0.00';

        mainRow.avgDiff = avgDiff.toLocaleString();
        mainRow.avgRate = `${avgRate}%`;
        diffRow.avgDiff = '';
        diffRow.avgRate = '';
        rateRow.avgDiff = '';
        rateRow.avgRate = '';

        return [mainRow, diffRow, rateRow];
      });

      setRows(formattedRows);
    } catch (err) {
      console.error('API 호출 에러: ', err);
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
      <Container maxWidth="xl" style={{marginTop: '50px'}}>
        <Typography variant="h4" gutterBottom align="center">
          Telegram 채널 통계
        </Typography>

        <Box display="flex" justifyContent="flex-end" mb={2} px={2}>
          <Button variant="contained" onClick={fetchHistory}>새로고침</Button>
        </Box>

        {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center"
                 height={400}>
              <CircularProgress/>
            </Box>
        ) : (
            <Box width="100%" px={1}
                 sx={{overflowX: isMobile ? 'auto' : 'visible'}}>
              <DataGrid
                  autoHeight
                  rows={rows}
                  columns={columns}
                  density={isMobile ? 'compact' : isTablet
                      ? 'standard'
                      : 'comfortable'}
                  disableSelectionOnClick
                  disableColumnMenu
                  getRowClassName={({row}) => {
                    if (row.type === 'diff') return 'diff-row';
                    if (row.type === 'rate') return 'rate-row';
                    if (row.type === 'main') return 'channel-row';
                    return '';
                  }}
                  sx={{
                    minWidth: isMobile ? 800 : '100%',
                    '& .channel-row .channel-cell': {
                      backgroundColor: '#f9f9f9',
                      fontWeight: 'bold',
                    },
                    '& .channel-row': {
                      backgroundColor: '#f9f9f9',
                    },
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
                  }}
              />
            </Box>
        )}
      </Container>
  );
}

export default App;