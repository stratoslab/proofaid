import { useState } from 'react';
import {
  Alert, Badge, Box, Button, Card, CardContent, Divider, MenuItem, Paper, Select,
  Stack, Step, StepButton, Stepper, TextField, Typography
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BoltIcon from '@mui/icons-material/Bolt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TransactionLog from './TransactionLog';

const STEPS = ['Connect & Setup', 'Create Program', 'Register Beneficiaries', 'Issue Vouchers', 'Monitor'];

export default function AdminTab({
  address, connect, networkKey, setNetworkKey, switchNetwork,
  devnet, setDevnet, saveDevnet, contract, txWrap, identityHash,
  log, explorerBase, networks, lastTxHash,
  createdPrograms, issuedVouchers, addProgram, addVoucher
}) {
  const [step, setStep] = useState(0);
  const [program, setProgram] = useState(() => {
    const now = Math.floor(Date.now() / 1000);
    return {
      name: 'School Nutrition Program',
      description: 'Daily meal voucher distribution',
      budget: '50000',
      startDate: String(now),
      endDate: String(now + 30 * 24 * 60 * 60)
    };
  });
  const [beneficiary, setBeneficiary] = useState({ identityInput: '', programId: '1' });
  const [voucher, setVoucher] = useState({ programId: '1', identityInput: '', expiryDays: '30' });
  const [createdProgramId, setCreatedProgramId] = useState('');
  const [issuedVoucherId, setIssuedVoucherId] = useState('');

  const parseEvent = (receipt, contractName, eventName) => {
    try {
      const c = contract(contractName);
      for (const log of receipt.logs) {
        try {
          const parsed = c.interface.parseLog({ topics: log.topics, data: log.data });
          if (parsed?.name === eventName) return parsed.args;
        } catch {}
      }
    } catch {}
    return null;
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
              <Typography variant="h6">Connect Wallet & Select Network</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="contained" startIcon={<AccountBalanceWalletIcon />} onClick={connect}>
                  Connect Wallet
                </Button>
                <Badge color="secondary" badgeContent={address ? 'Connected' : 'Offline'}>
                  <BoltIcon />
                </Badge>
              </Stack>
              <Typography variant="body2">{address || 'No wallet connected'}</Typography>

              <Stack direction="row" spacing={1}>
                <Select value={networkKey} onChange={(e) => setNetworkKey(e.target.value)} size="small" sx={{ minWidth: 220 }}>
                  {networks.map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                  <MenuItem value="devnet">Custom Devnet</MenuItem>
                </Select>
                <Button variant="outlined" onClick={switchNetwork}>Switch</Button>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant="text" endIcon={<OpenInNewIcon />}
                  href="https://faucet.celo.org/celo-sepolia" target="_blank" rel="noreferrer">
                  Celo Sepolia Faucet
                </Button>
                <Button size="small" variant="text" endIcon={<OpenInNewIcon />}
                  href="https://sepolia.celoscan.io/" target="_blank" rel="noreferrer">
                  Sepolia Explorer
                </Button>
                {lastTxHash && explorerBase && (
                  <Button size="small" variant="text" endIcon={<OpenInNewIcon />}
                    href={`${explorerBase}/tx/${lastTxHash}`} target="_blank" rel="noreferrer">
                    Latest Tx
                  </Button>
                )}
              </Stack>

              <Divider />
              <Typography variant="subtitle2">Custom Devnet</Typography>
              <TextField label="Name" size="small" value={devnet.name || ''} onChange={(e) => setDevnet({ ...devnet, name: e.target.value })} />
              <TextField label="RPC URL" size="small" value={devnet.rpcUrl || ''} onChange={(e) => setDevnet({ ...devnet, rpcUrl: e.target.value })} />
              <TextField label="Chain ID" size="small" value={devnet.chainId || ''} onChange={(e) => setDevnet({ ...devnet, chainId: e.target.value })} />
              <Button variant="text" onClick={saveDevnet}>Save Devnet</Button>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2}>
              <Typography variant="h6">Create Aid Program</Typography>
              <Typography variant="body2" color="text.secondary">
                Define your aid program details and deploy it on-chain.
              </Typography>
              <TextField label="Program Name" size="small" value={program.name}
                onChange={(e) => setProgram({ ...program, name: e.target.value })} />
              <TextField label="Description" size="small" value={program.description}
                onChange={(e) => setProgram({ ...program, description: e.target.value })} />
              <TextField label="Budget" size="small" type="number" value={program.budget}
                onChange={(e) => setProgram({ ...program, budget: e.target.value })} />
              <TextField label="Start Timestamp" size="small" value={program.startDate}
                onChange={(e) => setProgram({ ...program, startDate: e.target.value })} />
              <TextField label="End Timestamp" size="small" value={program.endDate}
                onChange={(e) => setProgram({ ...program, endDate: e.target.value })} />
              <Button
                variant="contained"
                onClick={() => txWrap('createProgram', () =>
                  contract('AidProgram').createProgram(
                    program.name, program.description,
                    BigInt(program.budget), BigInt(program.startDate), BigInt(program.endDate)
                  ),
                  (receipt) => {
                    const args = parseEvent(receipt, 'AidProgram', 'ProgramCreated');
                    if (args) {
                      const id = args.programId.toString();
                      setCreatedProgramId(id);
                      addProgram({ id, name: program.name });
                      setBeneficiary((prev) => ({ ...prev, programId: id }));
                      setVoucher((prev) => ({ ...prev, programId: id }));
                    }
                  }
                )}
              >
                Create Program On-Chain
              </Button>
              {createdProgramId && (
                <Alert severity="success">
                  Program created! ID: <strong>{createdProgramId}</strong> — this ID has been auto-filled in the next steps.
                </Alert>
              )}
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2}>
              <Typography variant="h6">Register Beneficiaries</Typography>
              <Typography variant="body2" color="text.secondary">
                Enter identity information to create a privacy-preserving hash registered on-chain.
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
                Register Beneficiary Hash
              </Button>
            </Stack>
          )}

          {step === 3 && (
            <Stack spacing={2}>
              <Typography variant="h6">Issue Vouchers</Typography>
              <Typography variant="body2" color="text.secondary">
                Issue an ERC-1155 voucher NFT to a registered beneficiary.
              </Typography>
              {createdPrograms.length > 0 ? (
                <TextField select label="Program" size="small"
                  value={voucher.programId}
                  onChange={(e) => setVoucher({ ...voucher, programId: e.target.value })}>
                  {createdPrograms.map((p) => (
                    <MenuItem key={p.id} value={p.id}>#{p.id} — {p.name}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField label="Program ID" size="small" type="number"
                  value={voucher.programId}
                  onChange={(e) => setVoucher({ ...voucher, programId: e.target.value })}
                  helperText="No programs created yet — enter a known ID" />
              )}
              <TextField label="Beneficiary Identity Seed" size="small"
                value={voucher.identityInput}
                onChange={(e) => setVoucher({ ...voucher, identityInput: e.target.value })} />
              <TextField label="Expiry Days" size="small" type="number"
                value={voucher.expiryDays}
                onChange={(e) => setVoucher({ ...voucher, expiryDays: e.target.value })} />
              <Button
                variant="contained"
                onClick={() => txWrap('issueVoucher', () =>
                  contract('AidVoucher').issueVoucher(
                    BigInt(voucher.programId),
                    identityHash(voucher.identityInput),
                    BigInt(voucher.expiryDays)
                  ),
                  (receipt) => {
                    const args = parseEvent(receipt, 'AidVoucher', 'VoucherIssued');
                    if (args) {
                      const vid = args.voucherId.toString();
                      setIssuedVoucherId(vid);
                      addVoucher({ id: vid, programId: voucher.programId });
                    }
                  }
                )}
              >
                Issue Voucher
              </Button>
              {issuedVoucherId && (
                <Alert severity="success">
                  Voucher issued! ID: <strong>{issuedVoucherId}</strong> — share this ID with the field worker for redemption.
                </Alert>
              )}
            </Stack>
          )}

          {step === 4 && (
            <TransactionLog log={log} explorerBase={explorerBase} />
          )}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button variant="contained" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
