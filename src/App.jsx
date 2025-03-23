import {useCallback, useEffect, useMemo, useState} from 'react';
import {DataGrid, useGridApiRef} from '@mui/x-data-grid';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Typography,
  useMediaQuery,
} from '@mui/material';
import dayjs from 'dayjs';

function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

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
      flex: 1.5,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const row = params.row;
        if (row.type === 'main') {
          return (
              <Link href={row.url} target="_blank" rel="noopener"
                    underline="hover" style={{fontWeight: 'bold'}} // 폰트 굵게 적용
              >
                {params.value}
              </Link>
          );
        }
        return params.value;
      },
      cellClassName: 'channel-cell',
    },
    ...dates.slice(1).map((date) => ({
      field: date,
      headerName: dayjs(date).format('M/D'),
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
      renderCell: ({value}) => {
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
      renderCell: ({value}) => {
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

      const avgDiff = diffCount > 0 ? Math.round(totalDiff) : 0;
      const avgRate = diffCount > 0
          ? (totalRate / diffCount).toFixed(2)
          : '0.00';

      mainRow.avgDiff = avgDiff;
      mainRow.avgRate = `${avgRate}%`;
      diffRow.avgDiff = '';
      diffRow.avgRate = '';
      rateRow.avgDiff = '';
      rateRow.avgRate = '';

      return [mainRow, diffRow, rateRow];
    });
  }, [dates]);

  const initialFetch = useCallback(async () => {
    const res = await axios.get('http://localhost:5173/api/telegram/history');
    const formattedRows = processData(res.data);
    setRows(formattedRows);
  }, [processData]);

  const saveAndUpdateToday = useCallback(async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5173/api/telegram/save');
      const res = await axios.get('http://localhost:5173/api/telegram/history');
      const formattedRows = processData(res.data);

      setRows(formattedRows);
      apiRef.current.updateRows(formattedRows);
    } finally {
      setLoading(false);
    }
  }, [processData, apiRef]);

  useEffect(() => {
    void initialFetch();
  }, [initialFetch]);

  return (
      <Container maxWidth="xl" style={{marginTop: '50px'}}>
        <Typography variant="h4" gutterBottom align="center">
          Telegram 채널 통계
        </Typography>

        <Box display="flex" justifyContent="flex-end" mb={2} px={2}>
          <Button
              variant="contained"
              onClick={saveAndUpdateToday}
              disabled={loading}
              startIcon={loading
                  ? <CircularProgress size={20} color="inherit"/>
                  : null}
          >
            {loading ? '업데이트 중...' : '새로고침'}
          </Button>
        </Box>

        <Box width="100%" px={1}
             sx={{overflowX: isMobile ? 'auto' : 'visible'}}>
          <DataGrid
              apiRef={apiRef}
              autoHeight
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              density={isMobile ? 'compact' : isTablet
                  ? 'standard'
                  : 'comfortable'}
              disableSelectionOnClick
              disableColumnMenu
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
      </Container>
  );
}

export default App;