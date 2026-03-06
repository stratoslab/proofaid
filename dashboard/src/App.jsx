import { useEffect, useState } from 'react';
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import LanIcon from '@mui/icons-material/Lan';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VerifiedIcon from '@mui/icons-material/Verified';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ethers } from 'ethers';

const BUILTIN = {
  alfajores: {
    label: 'Alfajores (legacy)',
    chainId: 44787,
    chainHex: '0xaef3',
    chainName: 'Celo Alfajores',
    rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
    blockExplorerUrls: ['https://alfajores.celoscan.io']
  },
  celoSepolia: {
    label: 'Celo Sepolia',
    chainId: 11142220,
    chainHex: '0xaa044c',
    chainName: 'Celo Sepolia',
    rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
    blockExplorerUrls: ['https://celo-sepolia.blockscout.com']
  },
  celo: {
    label: 'Celo Mainnet',
    chainId: 42220,
    chainHex: '0xa4ec',
    chainName: 'Celo',
    rpcUrls: ['https://forno.celo.org'],
    blockExplorerUrls: ['https://celoscan.io']
  }
};

const mkNative = { name: 'CELO', symbol: 'CELO', decimals: 18 };

const defaultProgram = () => {
  const now = Math.floor(Date.now() / 1000);
  return {
    name: 'School Nutrition Program',
    description: 'Daily meal voucher distribution',
    budget: '50000',
    startDate: String(now),
    endDate: String(now + 30 * 24 * 60 * 60)
  };
};

export default function App() {
  const [networkKey, setNetworkKey] = useState('celoSepolia');
  const [devnet, setDevnet] = useState(() => JSON.parse(localStorage.getItem('proofaid_devnet') || '{"name":"","rpcUrl":"","chainId":""}'));
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [deployments, setDeployments] = useState({});
  const [abis, setAbis] = useState({ contracts: {} });
  const [activeDeploy, setActiveDeploy] = useState(null);
  const [log, setLog] = useState([]);
  const [lastTxHash, setLastTxHash] = useState('');
  const [error, setError] = useState('');

  const [program, setProgram] = useState(defaultProgram);
  const [beneficiary, setBeneficiary] = useState({ identityInput: '', programId: '1' });
  const [voucher, setVoucher] = useState({ programId: '1', identityInput: '', expiryDays: '30' });
  const [redeemId, setRedeemId] = useState('1');

  useEffect(() => {
    const load = async () => {
      const [d, a] = await Promise.all([fetch('/contracts/deployments.json'), fetch('/contracts/abis.json')]);
      if (d.ok) setDeployments(await d.json());
      if (a.ok) setAbis(await a.json());
    };
    load();
  }, []);

  const push = (line) => setLog((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 80));

  const connectedChain = async (p) => {
    const n = await p.getNetwork();
    const deploy = Object.values(deployments).find((x) => Number(x.chainId) === Number(n.chainId));
    setActiveDeploy(deploy || null);
  };

  const connect = async () => {
    try {
      if (!window.ethereum) throw new Error('Wallet not found. Install MetaMask or Celo Extension Wallet.');
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send('eth_requestAccounts', []);
      const s = await p.getSigner();
      const a = await s.getAddress();
      setProvider(p);
      setSigner(s);
      setAddress(a);
      await connectedChain(p);
      push(`Wallet connected: ${a}`);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const saveDevnet = () => {
    localStorage.setItem('proofaid_devnet', JSON.stringify(devnet));
    push(`Saved devnet ${devnet.name || 'Unnamed'} (${devnet.chainId || 'n/a'})`);
  };

  const cfg = (key) => {
    if (key !== 'devnet') return BUILTIN[key];
    if (!devnet.name || !devnet.rpcUrl || !devnet.chainId) return null;
    return {
      label: devnet.name,
      chainId: Number(devnet.chainId),
      chainHex: `0x${Number(devnet.chainId).toString(16)}`,
      chainName: devnet.name,
      rpcUrls: [devnet.rpcUrl],
      blockExplorerUrls: devnet.blockExplorerUrl ? [devnet.blockExplorerUrl] : []
    };
  };

  const switchNetwork = async () => {
    try {
      if (!window.ethereum) throw new Error('Wallet not found.');
      const n = cfg(networkKey);
      if (!n) throw new Error('Devnet config is incomplete.');
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: n.chainHex }] });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: n.chainHex, chainName: n.chainName, rpcUrls: n.rpcUrls, nativeCurrency: mkNative, blockExplorerUrls: n.blockExplorerUrls }]
          });
        } else {
          throw e;
        }
      }
      if (provider) await connectedChain(provider);
      push(`Switched to ${n.label}`);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const identityHash = (raw) => ethers.sha256(ethers.toUtf8Bytes(String(raw).trim().toLowerCase()));

  const contract = (name) => {
    if (!signer) throw new Error('Connect wallet first.');
    if (!activeDeploy) throw new Error('No deployment for current chain.');
    const addr = activeDeploy.contracts[name];
    const abi = abis.contracts?.[name]?.abi;
    if (!addr || !abi) throw new Error(`Missing ${name} ABI/address.`);
    return new ethers.Contract(addr, abi, signer);
  };

  const txWrap = async (label, fn) => {
    try {
      setError('');
      const tx = await fn();
      setLastTxHash(tx.hash);
      push(`${label} submitted: ${tx.hash}`);
      await tx.wait();
      push(`${label} confirmed`);
    } catch (e) {
      const reason = e.reason || e.shortMessage || e.message;
      setError(reason);
      push(`ERROR: ${reason}`);
    }
  };

  const explorerBase = activeDeploy?.chainId === 11142220
    ? 'https://sepolia.celoscan.io'
    : activeDeploy?.chainId === 42220
      ? 'https://celoscan.io'
      : '';

  return (
    <Box className="unicef-shell">
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1CABE2' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <VerifiedIcon />
            <Typography variant="h6">ProofAid Operations Console</Typography>
          </Stack>
          <Chip icon={<LanIcon />} label={activeDeploy ? `Chain ${activeDeploy.chainId}` : 'No Deployment'} color={activeDeploy ? 'success' : 'warning'} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper className="hero" sx={{ p: 3, mb: 2 }}>
          <Typography variant="h4">Aid Operations Dashboard</Typography>
          <Typography sx={{ mt: 1, maxWidth: 760 }} color="text.secondary">
            Field-ready voucher operations across Celo networks with transparent smart-contract verification.
          </Typography>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Wallet & Networks</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" startIcon={<AccountBalanceWalletIcon />} onClick={connect}>Connect Wallet</Button>
                  <Badge color="secondary" badgeContent={address ? 'Connected' : 'Offline'}><BoltIcon /></Badge>
                </Stack>
                <Typography sx={{ mt: 1.5 }} variant="body2">{address || 'No wallet connected'}</Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Select value={networkKey} onChange={(e) => setNetworkKey(e.target.value)} size="small" sx={{ minWidth: 220 }}>
                    {Object.entries(BUILTIN).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                    <MenuItem value="devnet">Custom Devnet</MenuItem>
                  </Select>
                  <Button variant="outlined" onClick={switchNetwork}>Switch</Button>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<OpenInNewIcon />}
                    href="https://faucet.celo.org/celo-sepolia"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Celo Sepolia Faucet
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<OpenInNewIcon />}
                    href="https://sepolia.celoscan.io/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Sepolia Explorer
                  </Button>
                  {lastTxHash && explorerBase && (
                    <Button
                      size="small"
                      variant="text"
                      endIcon={<OpenInNewIcon />}
                      href={`${explorerBase}/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Latest Tx
                    </Button>
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2">Custom Devnet</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField label="Name" size="small" value={devnet.name || ''} onChange={(e) => setDevnet({ ...devnet, name: e.target.value })} />
                  <TextField label="RPC URL" size="small" value={devnet.rpcUrl || ''} onChange={(e) => setDevnet({ ...devnet, rpcUrl: e.target.value })} />
                  <TextField label="Chain ID" size="small" value={devnet.chainId || ''} onChange={(e) => setDevnet({ ...devnet, chainId: e.target.value })} />
                  <Button variant="text" onClick={saveDevnet}>Save Devnet</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Deployment Context</Typography>
                <pre className="deploy-pre">{JSON.stringify(activeDeploy || { status: 'No deployment on active chain' }, null, 2)}</pre>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>On-Chain Actions</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <Typography fontWeight={700}>Create Program</Typography>
                      <TextField label="Name" size="small" value={program.name} onChange={(e) => setProgram({ ...program, name: e.target.value })} />
                      <TextField label="Description" size="small" value={program.description} onChange={(e) => setProgram({ ...program, description: e.target.value })} />
                      <TextField label="Budget" size="small" value={program.budget} onChange={(e) => setProgram({ ...program, budget: e.target.value })} />
                      <TextField label="Start Timestamp" size="small" value={program.startDate} onChange={(e) => setProgram({ ...program, startDate: e.target.value })} />
                      <TextField label="End Timestamp" size="small" value={program.endDate} onChange={(e) => setProgram({ ...program, endDate: e.target.value })} />
                      <Button
                        variant="contained"
                        onClick={() => txWrap(
                          'createProgram',
                          () => contract('AidProgram').createProgram(
                            program.name,
                            program.description,
                            BigInt(program.budget),
                            BigInt(program.startDate),
                            BigInt(program.endDate)
                          )
                        )}
                      >
                        Submit Program
                      </Button>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <Typography fontWeight={700}>Beneficiary + Voucher</Typography>
                      <TextField label="Identity Seed (name|birthdate|region)" size="small" value={beneficiary.identityInput} onChange={(e) => setBeneficiary({ ...beneficiary, identityInput: e.target.value })} />
                      <TextField label="Program ID" size="small" value={beneficiary.programId} onChange={(e) => setBeneficiary({ ...beneficiary, programId: e.target.value })} />
                      <Button
                        variant="outlined"
                        onClick={() => txWrap(
                          'registerBeneficiary',
                          () => contract('BeneficiaryRegistry').registerBeneficiary(
                            identityHash(beneficiary.identityInput),
                            BigInt(beneficiary.programId)
                          )
                        )}
                      >
                        Register Beneficiary Hash
                      </Button>

                      <TextField label="Voucher Program ID" size="small" value={voucher.programId} onChange={(e) => setVoucher({ ...voucher, programId: e.target.value })} />
                      <TextField label="Voucher Identity Seed" size="small" value={voucher.identityInput} onChange={(e) => setVoucher({ ...voucher, identityInput: e.target.value })} />
                      <TextField label="Expiry Days" size="small" value={voucher.expiryDays} onChange={(e) => setVoucher({ ...voucher, expiryDays: e.target.value })} />
                      <Button
                        variant="outlined"
                        onClick={() => txWrap(
                          'issueVoucher',
                          () => contract('AidVoucher').issueVoucher(
                            BigInt(voucher.programId),
                            identityHash(voucher.identityInput),
                            BigInt(voucher.expiryDays)
                          )
                        )}
                      >
                        Issue Voucher
                      </Button>

                      <TextField label="Redeem Voucher ID" size="small" value={redeemId} onChange={(e) => setRedeemId(e.target.value)} />
                      <Button
                        color="warning"
                        variant="contained"
                        onClick={() => txWrap('redeemVoucher', () => contract('AidVoucher').redeemVoucher(BigInt(redeemId)))}
                      >
                        Redeem Voucher
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Transaction Log</Typography>
                <Stack spacing={0.7}>
                  {log.length === 0 ? <Typography color="text.secondary">No transactions yet.</Typography> : log.map((item) => (
                    <Paper key={item} variant="outlined" sx={{ p: 1, fontFamily: 'monospace', fontSize: 12 }}>{item}</Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
