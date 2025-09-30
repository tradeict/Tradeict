import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Coupon {
  id: string;
  title: string;
  description: string;
  points_required: number;
  value: number;
  is_active: boolean;
  expiry_date?: string;
}

export default function Coupons() {
  const { user, refreshUser } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/coupons`);
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCoupons(),
      refreshUser(),
    ]);
    setRefreshing(false);
  };

  const handleRedeemCoupon = async (coupon: Coupon) => {
    if ((user?.earnings_balance || 0) < coupon.points_required) {
      Alert.alert(
        'Insufficient Earnings',
        `You need ${formatCurrency(coupon.points_required)} in earnings to redeem this coupon.`
      );
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${coupon.title}" for ${formatCurrency(coupon.points_required)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => processRedemption(coupon),
        },
      ]
    );
  };

  const processRedemption = async (coupon: Coupon) => {
    setRedeeming(coupon.id);
    try {
      const formData = new FormData();
      formData.append('coupon_id', coupon.id);

      await axios.post(`${API_URL}/api/coupons/redeem`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Redemption Successful!',
        `You have successfully redeemed "${coupon.title}". Check your email for details.`
      );
      
      refreshUser();
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.response?.data?.detail || 'Please try again');
    } finally {
      setRedeeming(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const canRedeem = (coupon: Coupon) => {
    return !isExpired(coupon.expiry_date) && 
           (user?.earnings_balance || 0) >= coupon.points_required;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Earnings Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="trophy" size={24} color="#34C759" />
            <Text style={styles.balanceTitle}>Available Earnings</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {formatCurrency(user?.earnings_balance || 0)}
          </Text>
          <Text style={styles.balanceDescription}>
            Use your earnings to redeem exclusive coupons
          </Text>
        </View>

        {/* Coupons Section */}
        <View style={styles.couponsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Coupons</Text>
            <Text style={styles.sectionCount}>{coupons.filter(c => c.is_active).length}</Text>
          </View>

          {coupons.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No Coupons Available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for exclusive offers and rewards
              </Text>
            </View>
          ) : (
            coupons.map((coupon) => (
              <View key={coupon.id} style={[
                styles.couponCard,
                isExpired(coupon.expiry_date) && styles.expiredCard
              ]}>
                <View style={styles.couponHeader}>
                  <View style={styles.couponTitleContainer}>
                    <Text style={[
                      styles.couponTitle,
                      isExpired(coupon.expiry_date) && styles.expiredText
                    ]}>
                      {coupon.title}
                    </Text>
                    {isExpired(coupon.expiry_date) && (
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredBadgeText}>EXPIRED</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.couponValue}>
                    <Text style={styles.couponValueText}>
                      {formatCurrency(coupon.value)}
                    </Text>
                    <Text style={styles.couponValueLabel}>Value</Text>
                  </View>
                </View>

                <Text style={[
                  styles.couponDescription,
                  isExpired(coupon.expiry_date) && styles.expiredText
                ]}>
                  {coupon.description}
                </Text>

                <View style={styles.couponDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons 
                      name="pricetag-outline" 
                      size={16} 
                      color={isExpired(coupon.expiry_date) ? "#ccc" : "#666"} 
                    />
                    <Text style={[
                      styles.detailText,
                      isExpired(coupon.expiry_date) && styles.expiredText
                    ]}>
                      Cost: {formatCurrency(coupon.points_required)}
                    </Text>
                  </View>
                  
                  {coupon.expiry_date && (
                    <View style={styles.detailItem}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={16} 
                        color={isExpired(coupon.expiry_date) ? "#FF3B30" : "#666"} 
                      />
                      <Text style={[
                        styles.detailText,
                        isExpired(coupon.expiry_date) && { color: '#FF3B30' }
                      ]}>
                        Expires: {formatDate(coupon.expiry_date)}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    (!canRedeem(coupon) || redeeming === coupon.id) && styles.redeemButtonDisabled
                  ]}
                  onPress={() => handleRedeemCoupon(coupon)}
                  disabled={!canRedeem(coupon) || redeeming === coupon.id}
                >
                  {redeeming === coupon.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons 
                        name="gift" 
                        size={16} 
                        color={canRedeem(coupon) ? "#fff" : "#ccc"} 
                      />
                      <Text style={[
                        styles.redeemButtonText,
                        !canRedeem(coupon) && styles.redeemButtonTextDisabled
                      ]}>
                        {isExpired(coupon.expiry_date) 
                          ? 'Expired' 
                          : (user?.earnings_balance || 0) < coupon.points_required
                            ? 'Insufficient Earnings'
                            : 'Redeem Now'
                        }
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
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
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
  },
  balanceDescription: {
    fontSize: 14,
    color: '#666',
  },
  couponsSection: {
    paddingBottom: 32,
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
  couponCard: {
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
  expiredCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  couponTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  expiredBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  expiredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  couponValue: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  couponValueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  couponValueLabel: {
    fontSize: 12,
    color: '#666',
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  couponDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  expiredText: {
    color: '#ccc',
  },
  redeemButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  redeemButtonTextDisabled: {
    color: '#ccc',
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