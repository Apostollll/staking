import { useState, useEffect } from 'react';
import { TonConnectUI } from '@tonconnect/ui';
import TonWeb from 'tonweb';

const OP_STAKE = 0x01;
const OP_UNSTAKE = 0x02;
const OP_CLAIM = 0x03;
const LOCK_PERIOD_SECONDS = 21 * 86400;

const tonweb = new TonWeb();

function encodePayload(op, amount) {
  const cell = new tonweb.boc.Cell();
  cell.bits.writeUint(op, 32);
  if (amount !== undefined) {
    cell.bits.writeUint(amount, 64);
  }
  return cell.toBoc().toString('base64');
}

export default function StakingPanel() {
  const [amount, setAmount] = useState('');
  const [stakingTimestamp, setStakingTimestamp] = useState(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [stakedBalance, setStakedBalance] = useState(0);
  const [rewardBalance, setRewardBalance] = useState(0);

  const tonConnect = new TonConnectUI({ manifestUrl: 'https://yourdomain.com/tonconnect-manifest.json' });

  const jettonWallet = 'YOUR_JETTON_WALLET_ADDRESS';
  const stakingContract = 'YOUR_STAKING_CONTRACT_ADDRESS';

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const sendTransaction = async (payload, amountToSend = '15000000') => {
    await tonConnect.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: jettonWallet,
          amount: amountToSend,
          payload: {
            abi: 'payload',
            data: payload,
          },
        },
      ],
    });
  };

  const handleStake = async () => {
    const nanoAmount = (parseFloat(amount) * 1e9).toFixed(0);
    const payload = encodePayload(OP_STAKE, nanoAmount);
    await sendTransaction(payload);
    setStakingTimestamp(Math.floor(Date.now() / 1000));
  };

  const handleUnstake = async () => {
    const payload = encodePayload(OP_UNSTAKE);
    await sendTransaction(payload);
  };

  const handleClaim = async () => {
    const payload = encodePayload(OP_CLAIM);
    await sendTransaction(payload);
  };

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <input
        type="number"
        placeholder="Amount to stake"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-2 border rounded"
      />
      <button onClick={handleStake} className="p-2 bg-blue-500 text-white rounded">Stake</button>
      <button onClick={handleUnstake} className="p-2 bg-yellow-500 text-white rounded">Unstake</button>
      <button onClick={handleClaim} className="p-2 bg-green-500 text-white rounded">Claim Rewards</button>
      {stakingTimestamp && (
        <p>Unlock in: {formatTime(LOCK_PERIOD_SECONDS - (currentTime - stakingTimestamp))}</p>
      )}
    </div>
  );
}
