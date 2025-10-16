import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Wallet, TrendingUp, DollarSign, Download, Eye, EyeOff, RefreshCw, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { walletAPI } from '../utils/api';
import { nigerianBanks, formatNaira } from '../utils/paystack';

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  paymentReference: string;
}

interface WalletData {
  vendorId: string;
  walletBalance: number;
  totalEarnings: number;
  pendingBalance: number;
  totalWithdrawn: number;
  lastUpdated: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  accountNumber: string;
  bankCode: string;
  status: string;
  createdAt: string;
  reference: string;
}

export function VendorWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    password: '',
    bankCode: '',
    accountNumber: '',
    accountName: ''
  });

  useEffect(() => {
    loadWalletData();
    loadWithdrawals();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const data = await walletAPI.getWallet();
      
      if (data.wallet) {
        setWallet(data.wallet);
      }
      
      if (data.recentTransactions) {
        setTransactions(data.recentTransactions);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const data = await walletAPI.getWithdrawals();
      if (data.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalForm.amount || !withdrawalForm.password || !withdrawalForm.bankCode || !withdrawalForm.accountNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(withdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (wallet && amount > wallet.walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (amount < 1000) {
      toast.error('Minimum withdrawal amount is ₦1,000');
      return;
    }

    setWithdrawing(true);

    try {
      const result = await walletAPI.withdraw(
        amount,
        withdrawalForm.password,
        withdrawalForm.bankCode,
        withdrawalForm.accountNumber,
        withdrawalForm.accountName
      );

      if (result.success) {
        toast.success('Withdrawal initiated successfully!');
        setShowWithdrawDialog(false);
        setWithdrawalForm({
          amount: '',
          password: '',
          bankCode: '',
          accountNumber: '',
          accountName: ''
        });
        
        // Reload wallet data
        await loadWalletData();
        await loadWithdrawals();
      } else {
        toast.error(result.error || 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Available Balance</p>
                <div className="flex items-center gap-2">
                  {showBalance ? (
                    <p className="text-3xl font-bold text-green-900">
                      {formatNaira(wallet?.walletBalance || 0)}
                    </p>
                  ) : (
                    <p className="text-3xl font-bold text-green-900">₦••••••</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-8 w-8 p-0"
                  >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={loadWalletData}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Earnings</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNaira(wallet?.totalEarnings || 0)}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Withdrawn</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNaira(wallet?.totalWithdrawn || 0)}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Pending Balance</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNaira(wallet?.pendingBalance || 0)}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowWithdrawDialog(true)}
            disabled={(wallet?.walletBalance || 0) < 1000}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Withdraw Funds
          </Button>
          {(wallet?.walletBalance || 0) < 1000 && (
            <p className="text-xs text-center text-gray-600 mt-2">
              Minimum withdrawal amount is ₦1,000
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest earnings from completed orders</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <ArrowDownRight className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order #{txn.orderId}</p>
                      <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+{formatNaira(txn.amount)}</p>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Track your withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No withdrawals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ArrowUpRight className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Withdrawal</p>
                      <p className="text-xs text-gray-500">{formatDate(withdrawal.createdAt)}</p>
                      <p className="text-xs text-gray-500">
                        Account: •••• {withdrawal.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">-{formatNaira(withdrawal.amount)}</p>
                    <Badge
                      className={`text-xs ${
                        withdrawal.status === 'completed' || withdrawal.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {withdrawal.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter your bank details to withdraw funds from your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                Available Balance: <span className="font-bold">{formatNaira(wallet?.walletBalance || 0)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount (minimum ₦1,000)"
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Bank *</Label>
              <Select
                value={withdrawalForm.bankCode}
                onValueChange={(value) => setWithdrawalForm({ ...withdrawalForm, bankCode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianBanks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="10-digit account number"
                maxLength={10}
                value={withdrawalForm.accountNumber}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name (Optional)</Label>
              <Input
                id="accountName"
                type="text"
                placeholder="Account holder name"
                value={withdrawalForm.accountName}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your account password"
                value={withdrawalForm.password}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, password: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Enter your FoodHub account password for verification
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
              disabled={withdrawing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {withdrawing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </div>
              ) : (
                'Withdraw'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
