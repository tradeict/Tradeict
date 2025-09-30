import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface UserStrategy {
  id: string;
  strategy_name: string;
  strategy_type: string;
  invested_amount: number;
  total_profit_loss: number;
  monthly_returns: number;
}

export default function Home() {
  const { user, refreshUser } = useAuth();
  const [userStrategies, setUserStrategies] = useState<UserStrategy[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserStrategies();
  }, []);

  const fetchUserStrategies = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user-strategies`);
      setUserStrategies(response.data);
    } catch (error) {
      console.error('Error fetching user strategies:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUser(),
      fetchUserStrategies(),
    ]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalInvested = userStrategies.reduce((sum, strategy) => sum + strategy.invested_amount, 0);
  const totalProfitLoss = userStrategies.reduce((sum, strategy) => sum + strategy.total_profit_loss, 0);
  const profitPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Logo */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../assets/tradeict-logo-dark.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.subGreeting}>Welcome to your trading dashboard</Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceCards}>
          <View style={[styles.balanceCard, styles.virtualCard]}>
            <Ionicons name="wallet-outline" size={24} color="#007AFF" />
            <Text style={styles.cardLabel}>Virtual Money</Text>
            <Text style={styles.cardAmount}>{formatCurrency(user?.virtual_balance || 0)}</Text>
            <Text style={styles.cardDescription}>Available for investment</Text>
          </View>
          
          <View style={[styles.balanceCard, styles.earningsCard]}>
            <Ionicons name="trending-up" size={24} color="#34C759" />
            <Text style={styles.cardLabel}>Trading Earnings</Text>
            <Text style={[styles.cardAmount, { color: '#34C759' }]}>
              {formatCurrency(user?.earnings_balance || 0)}
            </Text>
            <Text style={styles.cardDescription}>Available for coupons</Text>
          </View>
        </View>

        <View style={styles.balanceCards}>
          <View style={[styles.balanceCard, styles.taskCard]}>
            <Ionicons name="gift-outline" size={24} color="#FF9500" />
            <Text style={styles.cardLabel}>Task Rewards</Text>
            <Text style={[styles.cardAmount, { color: '#FF9500' }]}>
              {formatCurrency(user?.task_balance || 0)}
            </Text>
            <Text style={styles.cardDescription}>From daily login & ads</Text>
          </View>
          
          <View style={[styles.balanceCard, styles.investmentCard]}>
            <Ionicons name="bar-chart-outline" size={24} color="#FF3B30" />
            <Text style={styles.cardLabel}>Investment</Text>
            <Text style={[styles.cardAmount, { color: '#FF3B30' }]}>
              {formatCurrency(user?.total_investment || 0)}
            </Text>
            <Text style={styles.cardDescription}>Currently invested</Text>
          </View>
        </View>

        {/* Total Balance Summary */}
        <View style={styles.totalBalanceCard}>
          <View style={styles.totalBalanceHeader}>
            <Ionicons name="wallet" size={24} color="#007AFF" />
            <Text style={styles.totalBalanceTitle}>Total Portfolio Value</Text>
          </View>
          <Text style={styles.totalBalanceAmount}>
            {formatCurrency((user?.total_balance || 0))}
          </Text>
          <View style={styles.balanceBreakdown}>
            <Text style={styles.balanceBreakdownText}>
              Available for Investment: {formatCurrency((user?.available_for_investment || 0))}
            </Text>
            <Text style={styles.balanceBreakdownText}>
              Available for Coupons: {formatCurrency((user?.available_for_coupons || 0))}
            </Text>
          </View>
        </View>

        {/* Portfolio Summary */}
        {totalInvested > 0 && (
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioTitle}>Portfolio Performance</Text>
            <View style={styles.portfolioStats}>
              <View style={styles.portfolioStat}>
                <Text style={styles.portfolioStatLabel}>Total Invested</Text>
                <Text style={styles.portfolioStatValue}>{formatCurrency(totalInvested)}</Text>
              </View>
              <View style={styles.portfolioStat}>
                <Text style={styles.portfolioStatLabel}>Total P&L</Text>
                <Text style={[
                  styles.portfolioStatValue,
                  { color: totalProfitLoss >= 0 ? '#34C759' : '#FF3B30' }
                ]}>
                  {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
                </Text>
              </View>
              <View style={styles.portfolioStat}>
                <Text style={styles.portfolioStatLabel}>Return</Text>
                <Text style={[
                  styles.portfolioStatValue,
                  { color: profitPercentage >= 0 ? '#34C759' : '#FF3B30' }
                ]}>
                  {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Banner Ad */}
        <View style={styles.adContainer}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.FULL_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={() => {
              console.log('Banner ad loaded');
            }}
            onAdFailedToLoad={(error) => {
              console.error('Banner ad failed to load:', error);
            }}
          />
        </View>

        {/* Active Strategies */}
        <View style={styles.strategiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Active Strategies</Text>
            <Text style={styles.sectionCount}>{userStrategies.length}</Text>
          </View>
          
          {userStrategies.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No Active Strategies</Text>
              <Text style={styles.emptyStateText}>
                Start investing in strategies to see your portfolio here
              </Text>
            </View>
          ) : (
            userStrategies.map((strategy) => (
              <View key={strategy.id} style={styles.strategyCard}>
                <View style={styles.strategyHeader}>
                  <View style={styles.strategyInfo}>
                    <Text style={styles.strategyName}>{strategy.strategy_name}</Text>
                    <View style={[
                      styles.strategyType,
                      strategy.strategy_type === 'risky' ? styles.riskyType : styles.guaranteedType
                    ]}>
                      <Text style={[
                        styles.strategyTypeText,
                        strategy.strategy_type === 'risky' ? styles.riskyTypeText : styles.guaranteedTypeText
                      ]}>
                        {strategy.strategy_type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.strategyStats}>
                    <Text style={styles.strategyStatsLabel}>Returns</Text>
                    <Text style={styles.strategyStatsValue}>
                      {strategy.monthly_returns}%/month
                    </Text>
                  </View>
                </View>
                <View style={styles.strategyFooter}>
                  <View style={styles.strategyStat}>
                    <Text style={styles.strategyStatLabel}>Invested</Text>
                    <Text style={styles.strategyStatValue}>
                      {formatCurrency(strategy.invested_amount)}
                    </Text>
                  </View>
                  <View style={styles.strategyStat}>
                    <Text style={styles.strategyStatLabel}>P&L</Text>
                    <Text style={[
                      styles.strategyStatValue,
                      { color: strategy.total_profit_loss >= 0 ? '#34C759' : '#FF3B30' }
                    ]}>
                      {strategy.total_profit_loss >= 0 ? '+' : ''}
                      {formatCurrency(strategy.total_profit_loss)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  greetingSection: {
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
  },
  balanceCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  virtualCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  earningsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  taskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  investmentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  totalBalanceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  totalBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalBalanceTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  totalBalanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  balanceBreakdown: {
    gap: 4,
  },
  balanceBreakdownText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  portfolioCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  portfolioStat: {
    alignItems: 'center',
  },
  portfolioStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  portfolioStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  adContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  strategiesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strategyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  strategyType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  riskyType: {
    backgroundColor: '#FFE5E5',
  },
  guaranteedType: {
    backgroundColor: '#E5F5E5',
  },
  strategyTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  riskyTypeText: {
    color: '#FF3B30',
  },
  guaranteedTypeText: {
    color: '#34C759',
  },
  strategyStats: {
    alignItems: 'flex-end',
  },
  strategyStatsLabel: {
    fontSize: 12,
    color: '#666',
  },
  strategyStatsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  strategyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  strategyStat: {
    alignItems: 'center',
  },
  strategyStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  strategyStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});