import {useCallback, useEffect, useState} from 'react';
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
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:1024px)');

  const getLast12Days = () => {
    const days = [];
    for (let i = 11; i >= 0; i--) {
      days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
    }
    return days;
  };

  const fetchHistory = useCallback(() => {
    setLoading(true);
    axios.get('https://telegram-ofu6.onrender.com/api/telegram/history').
        then((res) => {
          const dates = getLast12Days();

          const dynamicColumns = [
            {
              field: 'channel',
              headerName: '',
              minWidth: 100,
              flex: 1.5,
              cellClassName: 'channel-cell',
            },
            ...dates.slice(1).map(date => ({
              field: date,
              headerName: dayjs(date).format('M/D'),
              minWidth: isMobile ? 50 : 80,
              flex: isMobile ? 0.3 : 0.5,
              renderCell: (params) => params.value !== null
                  ? params.value
                  : '-',
            })),
            {
              field: 'avgDiff',
              headerName: '총 증감',
              minWidth: isMobile ? 70 : 90,
              flex: isMobile ? 0.4 : 0.6,
              renderCell: (params) => {
                const value = parseInt(params.value.replace(/,/g, ''), 10);
                return (
                    <span style={{
                      color: value > 0 ? 'red' : value < 0
                          ? 'blue'
                          : 'black',
                    }}>
                  {params.value}
                </span>
                );
              },
            },
            {
              field: 'avgRate',
              headerName: '총 증감률',
              minWidth: isMobile ? 70 : 90,
              flex: isMobile ? 0.4 : 0.6,
              renderCell: (params) => {
                const numeric = parseFloat(params.value.replace('%', ''));
                return (
                    <span style={{
                      color: numeric > 0 ? 'red' : numeric < 0
                          ? 'blue'
                          : 'black',
                    }}>
                  {params.value}
                </span>
                );
              },
            },
            {
              field: 'action',
              headerName: '',
              minWidth: 60,
              flex: 0.4,
              renderCell: (params) => {
                if (params.row.type !== 'main') return '';
                return (
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                    }}>
                      <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          href={params.row.url}
                          target="_blank"
                      >
                        이동
                      </Button>
                    </Box>
                );
              },
            },
          ];
          setColumns(dynamicColumns);

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

          const formattedRows = Object.values(groupedData).
              flatMap((row, index) => {
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

                  let diff = null;
                  let rate = null;

                  if (yesterday !== 0) {
                    diff = today - yesterday;
                    rate = ((diff / yesterday) * 100).toFixed(2);
                    totalDiff += diff;
                    totalRate += parseFloat(rate);
                    diffCount++;
                  }

                  mainRow[date] = today ? today.toLocaleString() : '-';

                  diffRow[date] = diff !== null ? <span style={{
                    color: diff > 0 ? 'red' : diff < 0
                        ? 'blue'
                        : 'black',
                  }}>{diff.toLocaleString()}</span> : '-';

                  rateRow[date] = rate !== null ? <span style={{
                    color: parseFloat(rate) > 0 ? 'red' : parseFloat(rate) < 0
                        ? 'blue'
                        : 'black',
                  }}>{`${rate}%`}</span> : '-';
                });

                const avgDiff = diffCount > 0 ? Math.round(totalDiff) : 0;
                const avgRate = diffCount > 0 ? (totalRate / diffCount).toFixed(
                    2) : '0.00';

                mainRow.avgDiff = avgDiff.toLocaleString();
                mainRow.avgRate = `${avgRate}%`;
                diffRow.avgDiff = '';
                diffRow.avgRate = '';
                rateRow.avgDiff = '';
                rateRow.avgRate = '';

                return [mainRow, diffRow, rateRow];
              });

          setRows(formattedRows);
        }).
        catch((err) => {
          console.error('API 호출 에러: ', err);
        }).
        finally(() => {
          setLoading(false);
        });
  }, [isMobile]);

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
            <Box width="100%" px={1}>
              <DataGrid
                  autoHeight
                  rows={rows}
                  columns={columns}
                  density={isMobile ? 'compact' : isTablet
                      ? 'standard'
                      : 'comfortable'}
                  disableSelectionOnClick
                  getRowClassName={(params) => {
                    if (params.row.type === 'diff') return 'diff-row';
                    if (params.row.type === 'rate') return 'rate-row';
                    if (params.row.type === 'main') return 'channel-row';
                    return '';
                  }}
                  sx={{
                    '& .channel-row .channel-cell': {
                      backgroundColor: '#f9f9f9',
                      fontWeight: 'bold',
                    },
                    '& .channel-row': {
                      backgroundColor: '#f9f9f9',
                    },
                    '& .MuiDataGrid-columnHeaders .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 'bold',
                    },
                  }}
              />
            </Box>
        )}
      </Container>
  );
}

export default App;