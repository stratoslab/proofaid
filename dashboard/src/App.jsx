import { useEffect, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Chip,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LanIcon from '@mui/icons-material/Lan';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EngineeringIcon from '@mui/icons-material/Engineering';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { ethers } from 'ethers';
import AdminTab from './components/AdminTab';
import FieldWorkerTab from './components/FieldWorkerTab';
import DonorTab from './components/DonorTab';

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

export default function App() {
  const [role, setRole] = useState(0);
  const [networkKey, setNetworkKey] = useState('celoSepolia');
  const [devnet, setDevnet] = useState(() =>
    JSON.parse(localStorage.getItem('proofaid_devnet') || '{"name":"","rpcUrl":"","chainId":""}')
  );
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [deployments, setDeployments] = useState({});
  const [abis, setAbis] = useState({ contracts: {} });
  const [activeDeploy, setActiveDeploy] = useState(null);
  const [log, setLog] = useState([]);
  const [lastTxHash, setLastTxHash] = useState('');
  const [error, setError] = useState('');
  const [createdPrograms, setCreatedPrograms] = useState([]);
  const [issuedVouchers, setIssuedVouchers] = useState([]);

  const addProgram = (prog) => setCreatedPrograms((prev) => [...prev, prog]);
  const addVoucher = (v) => setIssuedVouchers((prev) => [...prev, v]);

  useEffect(() => {
    const load = async () => {
      const [d, a] = await Promise.all([
        fetch('/contracts/deployments.json'),
        fetch('/contracts/abis.json')
      ]);
      if (d.ok) setDeployments(await d.json());
      if (a.ok) setAbis(await a.json());
    };
    load();
  }, []);

  const push = (line, txHash = null) => {
    const entry = { time: new Date().toLocaleTimeString(), message: line, txHash };
    setLog((prev) => [entry, ...prev].slice(0, 80));
  };

  const connectedChain = async (p) => {
    const n = await p.getNetwork();
    const deploy = Object.values(deployments).find(
      (x) => Number(x.chainId) === Number(n.chainId)
    );
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
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: n.chainHex }]
        });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: n.chainHex,
              chainName: n.chainName,
              rpcUrls: n.rpcUrls,
              nativeCurrency: mkNative,
              blockExplorerUrls: n.blockExplorerUrls
            }]
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

  const identityHash = (raw) =>
    ethers.sha256(ethers.toUtf8Bytes(String(raw).trim().toLowerCase()));

  const contract = (name) => {
    if (!signer) throw new Error('Connect wallet first.');
    if (!activeDeploy) throw new Error('No deployment for current chain.');
    const addr = activeDeploy.contracts[name];
    const abi = abis.contracts?.[name]?.abi;
    if (!addr || !abi) throw new Error(`Missing ${name} ABI/address.`);
    return new ethers.Contract(addr, abi, signer);
  };

  const txWrap = async (label, fn, onConfirm) => {
    try {
      setError('');
      const tx = await fn();
      setLastTxHash(tx.hash);
      push(`${label} submitted`, tx.hash);
      const receipt = await tx.wait();
      push(`${label} confirmed`, tx.hash);
      if (onConfirm) onConfirm(receipt);
    } catch (e) {
      const reason = e.reason || e.shortMessage || e.message;
      setError(reason);
      push(`ERROR: ${reason}`);
    }
  };

  const explorerBase =
    activeDeploy?.chainId === 11142220
      ? 'https://sepolia.celoscan.io'
      : activeDeploy?.chainId === 42220
        ? 'https://celoscan.io'
        : '';

  const shared = {
    address, connect, networkKey, setNetworkKey, switchNetwork,
    devnet, setDevnet, saveDevnet, activeDeploy,
    contract, txWrap, identityHash,
    log, explorerBase, lastTxHash,
    networks: Object.entries(BUILTIN),
    createdPrograms, issuedVouchers, addProgram, addVoucher
  };

  return (
    <Box className="unicef-shell">
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1CABE2' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <VerifiedIcon />
            <Typography variant="h6">ProofAid</Typography>
          </Stack>
          <Chip
            icon={<LanIcon />}
            label={activeDeploy ? `Chain ${activeDeploy.chainId}` : 'No Deployment'}
            color={activeDeploy ? 'success' : 'warning'}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper className="hero" sx={{ p: 3, mb: 2 }}>
          <Typography variant="h4">Aid Operations Dashboard</Typography>
          <Typography sx={{ mt: 1, maxWidth: 760 }} color="text.secondary">
            Field-ready voucher operations across Celo networks with transparent smart-contract verification.
          </Typography>
        </Paper>

        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={role}
            onChange={(_, v) => setRole(v)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<AdminPanelSettingsIcon />} label="Admin" iconPosition="start" />
            <Tab icon={<EngineeringIcon />} label="Field Worker" iconPosition="start" />
            <Tab icon={<VolunteerActivismIcon />} label="Donor" iconPosition="start" />
          </Tabs>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {role === 0 && <AdminTab {...shared} />}
        {role === 1 && <FieldWorkerTab {...shared} />}
        {role === 2 && <DonorTab {...shared} />}
      </Container>
    </Box>
  );
}
