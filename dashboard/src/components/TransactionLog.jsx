import { Button, Paper, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function TransactionLog({ log, explorerBase }) {
  return (
    <>
      <Typography variant="h6" gutterBottom>Transaction Log</Typography>
      <Stack spacing={0.7}>
        {log.length === 0 ? (
          <Typography color="text.secondary">No transactions yet.</Typography>
        ) : (
          log.map((entry, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1, fontFamily: 'monospace', fontSize: 12 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {entry.time}  {entry.message}
                </Typography>
                {entry.txHash && explorerBase && (
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    href={`${explorerBase}/tx/${entry.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ fontSize: 11, py: 0, minHeight: 'auto' }}
                  >
                    View Tx
                  </Button>
                )}
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </>
  );
}
