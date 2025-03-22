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

      // 컬럼 설정
      const dynamicColumns = [
        {field: 'channel', headerName: '채널명', minWidth: 150, flex: 1.5},
        ...dates.map(date => ({
          field: date,
          headerName: dayjs(date).format('M/D'),
          minWidth: 80, // 날짜 컬럼 너비 줄이기
          flex: 0.7,    // flex도 축소
          renderCell: (params) =>
              params.value ? params.value.toLocaleString() : '-',
        })),
        {
          field: 'action',
          headerName: '링크',
          minWidth: 100,
          flex: 0.8,
          renderCell: (params) => (
              <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  href={params.row.url}
                  target="_blank"
              >
                이동
              </Button>
          ),
        },
      ];
      setColumns(dynamicColumns);

      const groupedData = res.data.reduce((acc, item) => {
        const {channelName, channelUrl, date, subscriberCount} = item;

        if (!acc[channelName]) {
          acc[channelName] = {channel: channelName, url: channelUrl};
        }
        acc[channelName][date] = subscriberCount;
        return acc;
      }, {});

      const formattedRows = Object.values(groupedData).map((row, index) => ({
        id: index + 1,
        ...row,
      }));

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
            <div style={{
              width: '1300px',
              margin: '0 auto',
            }}> {/* 가로 1300px로 확장 */}
              <DataGrid
                  autoHeight
                  rows={rows}
                  columns={columns}
                  pageSize={8}
                  rowsPerPageOptions={[8]}
                  disableSelectionOnClick
                  sx={{borderRadius: 2, boxShadow: 3}}
              />
            </div>
        )}
      </Container>
  );
}

export default App;