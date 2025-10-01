import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Landing() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: 'trending-up',
      title: 'Virtual Trading',
      description: 'Practice with virtual money and test proven strategies without risking real funds',
      color: '#007AFF',
    },
    {
      icon: 'shield-checkmark',
      title: 'Proven Strategies',
      description: 'Access market-tested strategies with detailed logic and historical performance',
      color: '#34C759',
    },
    {
      icon: 'cash',
      title: 'Earn Rewards',
      description: 'Earn virtual money through daily logins, video ads, and successful trading',
      color: '#FF9500',
    },
    {
      icon: 'gift',
      title: 'Redeem Coupons',
      description: 'Convert your trading profits into real-world rewards and gift cards',
      color: '#FF3B30',
    },
    {
      icon: 'robot',
      title: 'Real Bot Access',
      description: 'Get ready to use automated bots with the strategies you\'ve mastered',
      color: '#5856D6',
    },
  ];

  const benefits = [
    'Start with $10,000 virtual money',
    'Daily login bonus of $100',
    'Watch ads to earn $1,000',
    'Test strategies risk-free',
    'Learn market analysis',
    'Prepare for real trading',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../assets/tradeict-logo-dark.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Master Trading with Virtual Money</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Practice Trading,{'\n'}Master Strategies,{'\n'}Earn Real Rewards
          </Text>
          <Text style={styles.heroSubtitle}>
            Learn market-proven strategies with virtual money, then transition to real trading with confidence
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.primaryButtonText}>Get Started Free</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
            <Ionicons name="log-in" size={20} color="#007AFF" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose Tradeict?</Text>
          
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.featureCard,
                activeFeature === index && styles.activeFeatureCard
              ]}
              onPress={() => setActiveFeature(index)}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How Tradeict Helps You</Text>
          
          <View style={styles.helpSection}>
            <View style={styles.helpCard}>
              <Ionicons name="school" size={32} color="#007AFF" />
              <Text style={styles.helpTitle}>Learn Market Analysis</Text>
              <Text style={styles.helpDescription}>
                Understand how proven strategies work in different market conditions without any risk
              </Text>
            </View>
            
            <View style={styles.helpCard}>
              <Ionicons name="analytics" size={32} color="#34C759" />
              <Text style={styles.helpTitle}>Test Strategy Performance</Text>
              <Text style={styles.helpDescription}>
                Analyze historical performance and see real results of different trading approaches
              </Text>
            </View>
            
            <View style={styles.helpCard}>
              <Ionicons name="rocket" size={32} color="#FF9500" />
              <Text style={styles.helpTitle}>Prepare for Real Trading</Text>
              <Text style={styles.helpDescription}>
                Build confidence and experience before investing real money or using automated bots
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Sign Up & Get $10,000</Text>
              <Text style={styles.stepDescription}>
                Register and receive $10,000 virtual money to start your trading journey
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#34C759' }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Choose Your Strategy</Text>
              <Text style={styles.stepDescription}>
                Browse guaranteed and risky strategies with detailed performance metrics
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FF9500' }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Practice & Earn</Text>
              <Text style={styles.stepDescription}>
                Test strategies, track performance, and earn rewards through daily activities
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FF3B30' }]}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>Go Live or Use Bots</Text>
              <Text style={styles.stepDescription}>
                Apply your knowledge to real trading or request access to automated bots
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          <View style={styles.benefitsList}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Final Call to Action */}
        <View style={styles.finalCtaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.finalCtaTitle}>Ready to Master Trading?</Text>
            <Text style={styles.finalCtaSubtitle}>
              Join thousands of users learning proven trading strategies
            </Text>
            
            <TouchableOpacity
              style={styles.finalCtaButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.finalCtaButtonText}>Start Your Journey</Text>
              <Ionicons name="trending-up" size={20} color="#fff" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Start with virtual money, master proven strategies, earn real rewards
          </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  ctaButtons: {
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeFeatureCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowOpacity: 0.15,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  howItWorksSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  helpSection: {
    marginBottom: 32,
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepContainer: {
    gap: 24,
  },
  step: {
    alignItems: 'center',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  benefitsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  benefitsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    fontWeight: '500',
  },
  finalCtaSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  ctaCard: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  finalCtaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  finalCtaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  finalCtaButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalCtaButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});