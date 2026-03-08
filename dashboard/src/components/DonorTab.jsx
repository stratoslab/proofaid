import { useMemo } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, Typography
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupIcon from '@mui/icons-material/Group';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TransactionLog from './TransactionLog';

export default function DonorTab({ address, connect, log, explorerBase, activeDeploy }) {
  const metrics = useMemo(() => {
    const confirmed = log.filter((e) => e.message.includes('confirmed'));
    return {
      programs: confirmed.filter((e) => e.message.includes('createProgram')).length,
      beneficiaries: confirmed.filter((e) => e.message.includes('registerBeneficiary')).length,
      issued: confirmed.filter((e) => e.message.includes('issueVoucher')).length,
      redeemed: confirmed.filter((e) => e.message.includes('redeemVoucher')).length
    };
  }, [log]);

  const statCards = [
    { label: 'Programs Created', value: metrics.programs, icon: <AssignmentIcon fontSize="large" />, color: '#374EA2' },
    { label: 'Beneficiaries Registered', value: metrics.beneficiaries, icon: <GroupIcon fontSize="large" />, color: '#1CABE2' },
    { label: 'Vouchers Issued', value: metrics.issued, icon: <ConfirmationNumberIcon fontSize="large" />, color: '#FFC20E' },
    { label: 'Vouchers Redeemed', value: metrics.redeemed, icon: <CheckCircleIcon fontSize="large" />, color: '#23A26D' }
  ];

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" startIcon={<AccountBalanceWalletIcon />} onClick={connect}>
              {address ? 'Wallet Connected' : 'Connect Wallet'}
            </Button>
            {address && (
              <Typography variant="body2" color="text.secondary">{address}</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                <Typography variant="h4">{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Deployment Context</Typography>
          <pre className="deploy-pre">
            {JSON.stringify(activeDeploy || { status: 'No deployment on active chain' }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TransactionLog log={log} explorerBase={explorerBase} />
        </CardContent>
      </Card>
    </Box>
  );
}
