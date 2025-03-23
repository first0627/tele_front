import {useCallback, useEffect, useState} from 'react';
import {DataGrid} from '@mui/x-data-grid';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

function App() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const getLast10Days = () => {
    const days = [];
    for (let i = 10; i >= 0; i--) {
      days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
    }
    return days;
  };

  const fetchHistory = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:8080/api/telegram/history').then((res) => {
      const dates = getLast10Days();

      // columns 설정
      const dynamicColumns = [
        {field: 'channel', headerName: '채널명', minWidth: 150, flex: 1.5},
        ...dates.map(date => ({
          field: date,
          headerName: dayjs(date).format('M/D'),
          minWidth: 80,
          flex: 0.7,
          renderCell: (params) => params.value !== null ? params.value : '-',
        })),
        {
          field: 'avgDiff',
          headerName: '10일 평균 증감',
          minWidth: 100,
          flex: 0.8,
          renderCell: (params) => params.value !== null ? params.value : '-',
        },
        {
          field: 'avgRate',
          headerName: '10일 평균 증감률(%)',
          minWidth: 120,
          flex: 0.9,
          renderCell: (params) => params.value !== null ? params.value : '-',
        },
        {
          field: 'action',
          headerName: '링크',
          minWidth: 100,
          flex: 0.8,
          renderCell: (params) => (
              params.row.type === 'main' ? (
                  <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      href={params.row.url}
                      target="_blank"
                  >
                    이동
                  </Button>
              ) : null
          ),
        },
      ];
      setColumns(dynamicColumns);

      // 데이터 가공
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

      // row를 3줄씩 생성
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
        const diffRow = {id: `${index + 1}-diff`, type: 'diff', channel: '증감'};
        const rateRow = {id: `${index + 1}-rate`, type: 'rate', channel: '증감률'};

        dates.forEach((date, idx) => {
          const today = counts[date] || 0;
          const prevDate = dates[idx - 1];
          const yesterday = prevDate ? (counts[prevDate] || 0) : null;

          let diff = null;
          let rate = null;

          if (yesterday !== null && yesterday !== 0) {
            diff = today - yesterday;
            rate = ((diff / yesterday) * 100).toFixed(2);

            totalDiff += diff;
            totalRate += parseFloat(rate);
            diffCount++;
          }

          mainRow[date] = today ? today.toLocaleString() : '-';
          diffRow[date] = diff !== null ? diff.toLocaleString() : '-';
          rateRow[date] = rate !== null ? `${rate}%` : '-';
        });

        const avgDiff = diffCount > 0 ? Math.round(totalDiff / diffCount) : 0;
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
    }).catch((err) => {
      console.error('API 호출 에러: ', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
      <Container maxWidth="xl" style={{marginTop: '50px'}}>
        <Typography variant="h4" gutterBottom align="center">
          텔레그램 채널 10일간 구독자 수 이력
        </Typography>

        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button variant="contained" onClick={fetchHistory}>새로고침</Button>
        </Box>

        {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center"
                 height={400}>
              <CircularProgress/>
            </Box>
        ) : (
            <div style={{width: '1400px', margin: '0 auto'}}>
              <DataGrid
                  autoHeight
                  rows={rows}
                  columns={columns}
                  pageSize={30}
                  rowsPerPageOptions={[30]}
                  disableSelectionOnClick
                  getRowClassName={(params) => {
                    if (params.row.type === 'diff') return 'diff-row';
                    if (params.row.type === 'rate') return 'rate-row';
                    return '';
                  }}
                  sx={{
                    '& .diff-row': {backgroundColor: '#f9f9f9'},
                    '& .rate-row': {backgroundColor: '#f0f0f0'},
                  }}
              />
            </div>
        )}
      </Container>
  );
}

export default App;