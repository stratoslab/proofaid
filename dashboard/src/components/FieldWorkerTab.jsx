import { useState } from 'react';
import {
  Alert, Badge, Box, Button, Card, CardContent, CircularProgress, MenuItem,
  Paper, Stack, Step, StepButton, Stepper, TextField, Typography
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BoltIcon from '@mui/icons-material/Bolt';
import TransactionLog from './TransactionLog';

const STEPS = ['Connect Wallet', 'Register Beneficiary', 'Identify Beneficiary', 'Redeem Voucher'];

export default function FieldWorkerTab({
  address, connect, contract, txWrap, identityHash, log, explorerBase,
  createdPrograms, issuedVouchers
}) {
  const [step, setStep] = useState(0);
  const [beneficiary, setBeneficiary] = useState({ identityInput: '', programId: '1' });
  const [verifyInput, setVerifyInput] = useState('');
  const [verifiedHash, setVerifiedHash] = useState('');
  const [beneficiaryVouchers, setBeneficiaryVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [redeemId, setRedeemId] = useState('');

  const verifyAndFetchVouchers = async () => {
    const hash = identityHash(verifyInput);
    setVerifiedHash(hash);
    setBeneficiaryVouchers([]);
    setRedeemId('');
    setLoadingVouchers(true);

    try {
      const c = contract('AidVoucher');
      const nextId = await c.nextVoucherId();
      const found = [];

      for (let i = 1n; i < nextId; i++) {
        try {
          const v = await c.vouchers(i);
          if (v.beneficiaryHash === hash && Number(v.status) === 0) {
            found.push({
              id: v.id.toString(),
              programId: v.programId.toString(),
              expiresAt: new Date(Number(v.expiresAt) * 1000).toLocaleDateString()
            });
          }
        } catch {}
      }

      setBeneficiaryVouchers(found);
      if (found.length > 0) setRedeemId(found[0].id);
    } catch {}

    setLoadingVouchers(false);
  };

  return (
    <Box>
      <Stepper activeStep={step} nonLinear sx={{ mb: 3 }}>
        {STEPS.map((label, i) => (
          <Step key={label}>
            <StepButton onClick={() => setStep(i)}>{label}</StepButton>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          {step === 0 && (
            <Stack spacing={2}>
              <Typography variant="h6">Connect Your Wallet</Typography>
              <Typography variant="body2" color="text.secondary">
                Connect your wallet to start field operations. Transactions will be queued if offline.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="contained" startIcon={<AccountBalanceWalletIcon />} onClick={connect}>
                  Connect Wallet
                </Button>
                <Badge color="secondary" badgeContent={address ? 'Connected' : 'Offline'}>
                  <BoltIcon />
                </Badge>
              </Stack>
              <Typography variant="body2">{address || 'No wallet connected'}</Typography>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2}>
              <Typography variant="h6">Register Beneficiary</Typography>
              <Typography variant="body2" color="text.secondary">
                Register a new beneficiary by entering their identity information. The data is hashed for privacy.
              </Typography>
              <TextField label="Identity Seed (name|birthdate|region)" size="small"
                value={beneficiary.identityInput}
                onChange={(e) => setBeneficiary({ ...beneficiary, identityInput: e.target.value })} />
              {createdPrograms.length > 0 ? (
                <TextField select label="Program" size="small"
                  value={beneficiary.programId}
                  onChange={(e) => setBeneficiary({ ...beneficiary, programId: e.target.value })}>
                  {createdPrograms.map((p) => (
                    <MenuItem key={p.id} value={p.id}>#{p.id} — {p.name}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField label="Program ID" size="small" type="number"
                  value={beneficiary.programId}
                  onChange={(e) => setBeneficiary({ ...beneficiary, programId: e.target.value })}
                  helperText="No programs created yet — enter a known ID" />
              )}
              <Button
                variant="contained"
                onClick={() => txWrap('registerBeneficiary', () =>
                  contract('BeneficiaryRegistry').registerBeneficiary(
                    identityHash(beneficiary.identityInput), BigInt(beneficiary.programId)
                  )
                )}
              >
                Register Beneficiary
              </Button>
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2}>
              <Typography variant="h6">Identify Beneficiary</Typography>
              <Typography variant="body2" color="text.secondary">
                Verify the beneficiary's identity to retrieve their available vouchers for redemption.
              </Typography>
              <TextField label="Identity Seed (name|birthdate|region)" size="small"
                value={verifyInput}
                onChange={(e) => { setVerifyInput(e.target.value); setVerifiedHash(''); setBeneficiaryVouchers([]); }} />
              <Button
                variant="contained"
                onClick={verifyAndFetchVouchers}
                disabled={!verifyInput.trim() || loadingVouchers}
              >
                {loadingVouchers ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                {loadingVouchers ? 'Fetching Vouchers...' : 'Verify & Fetch Vouchers'}
              </Button>
              {verifiedHash && !loadingVouchers && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Beneficiary Hash</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                    {verifiedHash}
                  </Typography>
                  {beneficiaryVouchers.length > 0 ? (
                    <Alert severity="success" sx={{ mt: 1.5 }}>
                      Found {beneficiaryVouchers.length} unredeemed voucher{beneficiaryVouchers.length > 1 ? 's' : ''}. Proceed to redeem.
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ mt: 1.5 }}>
                      No unredeemed vouchers found for this beneficiary.
                    </Alert>
                  )}
                </Paper>
              )}
            </Stack>
          )}

          {step === 3 && (
            <Stack spacing={2}>
              <Typography variant="h6">Redeem Voucher</Typography>
              <Typography variant="body2" color="text.secondary">
                Select the voucher to redeem when aid has been delivered. The voucher NFT will be burned on-chain.
              </Typography>
              {!verifiedHash && (
                <Alert severity="info">
                  Go to "Identify Beneficiary" first to verify the recipient and load their vouchers.
                </Alert>
              )}
              {beneficiaryVouchers.length > 0 ? (
                <TextField select label="Voucher" size="small"
                  value={redeemId}
                  onChange={(e) => setRedeemId(e.target.value)}>
                  {beneficiaryVouchers.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      Voucher #{v.id} — Program #{v.programId} — Expires {v.expiresAt}
                    </MenuItem>
                  ))}
                </TextField>
              ) : issuedVouchers.length > 0 ? (
                <TextField select label="Voucher" size="small"
                  value={redeemId}
                  onChange={(e) => setRedeemId(e.target.value)}>
                  {issuedVouchers.map((v) => (
                    <MenuItem key={v.id} value={v.id}>Voucher #{v.id} (Program #{v.programId})</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField label="Voucher ID" size="small" type="number"
                  value={redeemId}
                  onChange={(e) => setRedeemId(e.target.value)}
                  helperText="No vouchers found — enter a known ID" />
              )}
              <Button
                variant="contained"
                color="warning"
                disabled={!redeemId}
                onClick={() => txWrap('redeemVoucher', () =>
                  contract('AidVoucher').redeemVoucher(BigInt(redeemId))
                )}
              >
                Redeem Voucher
              </Button>
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button variant="contained" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <TransactionLog log={log} explorerBase={explorerBase} />
        </CardContent>
      </Card>
    </Box>
  );
}
