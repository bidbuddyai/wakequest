import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { X, Check, Sparkles, Zap, Crown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatEnabled,
} from "@/lib/revenuecatClient";
import type { PurchasesPackage } from "react-native-purchases";

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [monthlyPackage, setMonthlyPackage] =
    useState<PurchasesPackage | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    if (!isRevenueCatEnabled()) {
      Alert.alert(
        "Payments Not Available",
        "Please open this app on your iPhone to subscribe.",
      );
      router.back();
      return;
    }

    const result = await getOfferings();
    if (result.ok && result.data.current) {
      const packages = result.data.current.availablePackages;
      const monthly = packages.find((p) => p.identifier === "$rc_monthly");
      setMonthlyPackage(monthly ?? null);
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!monthlyPackage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);

    const result = await purchasePackage(monthlyPackage);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Welcome to Premium!",
        "You now have access to all premium features. Enjoy!",
        [{ text: "Let's Go!", onPress: () => router.back() }],
      );
    } else {
      if (result.reason === "sdk_error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }

    setPurchasing(false);
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestoring(true);

    const result = await restorePurchases();

    if (result.ok) {
      const hasActiveEntitlements =
        Object.keys(result.data.entitlements.active || {}).length > 0;

      if (hasActiveEntitlements) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Purchases Restored",
          "Your premium subscription has been restored!",
          [{ text: "Great!", onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore.",
        );
      }
    } else {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }

    setRestoring(false);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0A0E27]">
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const monthlyPrice = monthlyPackage?.product.priceString ?? "$4.99";

  return (
    <View className="flex-1 bg-[#0A0E27]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 10 }}>
          <Pressable
            onPress={handleClose}
            className="absolute right-4 z-10 p-2"
            style={{ top: insets.top + 10 }}
          >
            <X size={28} color="#FFF" />
          </Pressable>

          <View className="items-center pt-8 pb-6">
            <View className="mb-3">
              <LinearGradient
                colors={["#FF6B35", "#F7931E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Crown size={40} color="#FFF" strokeWidth={2.5} />
              </LinearGradient>
            </View>
            <Text className="text-4xl font-bold text-white mb-2">
              WakeQuest Premium
            </Text>
            <Text className="text-lg text-gray-400 text-center px-6">
              Start your 7-day free trial
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="px-6 mb-6">
          <View className="bg-[#151B3B] rounded-2xl p-5">
            {[
              {
                icon: Sparkles,
                title: "All 9 Mission Types",
                desc: "Math, Memory, Shake, Photo, Barcode, Walk, Object Find, Sing, Riddle",
              },
              {
                icon: Zap,
                title: "AI-Powered Features",
                desc: "GPT-5.2 missions and voice assistant",
              },
              {
                icon: Check,
                title: "Reminder Notifications",
                desc: "Get alerts 1hr & 10min before alarms with cancel option",
              },
              {
                icon: Check,
                title: "Unlimited Snooze",
                desc: "Snooze as many times as you need (free users: 3 max)",
              },
              {
                icon: Check,
                title: "Voice Assistant",
                desc: "Create alarms with natural language commands",
              },
              {
                icon: Check,
                title: "Weather Integration",
                desc: "See weather when you wake up",
              },
              {
                icon: Check,
                title: "Unlimited Alarms",
                desc: "Create as many alarms as you need",
              },
              {
                icon: Check,
                title: "No Ads",
                desc: "Completely ad-free experience",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View
                  key={index}
                  className="flex-row items-start mb-4 last:mb-0"
                >
                  <View className="mr-3 mt-0.5">
                    <Icon size={24} color="#FF6B35" strokeWidth={2.5} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base mb-0.5">
                      {feature.title}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pricing Card */}
        <View className="px-6 mb-6">
          <View
            className="rounded-2xl p-5 border-2 border-[#FF6B35]"
            style={{ backgroundColor: "#1F2847" }}
          >
            <View className="items-center">
              <Text className="text-white font-bold text-2xl mb-1">
                7-day free trial
              </Text>
              <Text className="text-gray-300 text-base">
                Then {monthlyPrice}/month
              </Text>
            </View>
          </View>
        </View>

        {/* Subscribe Button */}
        <View className="px-6">
          <Pressable
            onPress={handlePurchase}
            disabled={purchasing}
            className="active:scale-95"
          >
            <LinearGradient
              colors={["#FF6B35", "#F7931E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 18,
                alignItems: "center",
              }}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Start 7-Day Free Trial
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Restore */}
        <View className="px-6 mt-4">
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            className="py-3 active:opacity-70"
          >
            <Text className="text-[#FF6B35] font-semibold text-center text-base">
              {restoring ? "Restoring..." : "Restore Purchases"}
            </Text>
          </Pressable>
        </View>

        {/* Legal Text */}
        <View className="px-6 mt-4">
          <Text className="text-gray-500 text-xs text-center leading-5">
            Subscription automatically renews for {monthlyPrice}/month after the
            7-day free trial unless canceled at least 24 hours before the end of
            the current period. Payment will be charged to your Apple ID account
            at confirmation of purchase. Cancel anytime in Account Settings.
          </Text>

          <View className="flex-row justify-center mt-4 gap-6">
            <Pressable
              onPress={() =>
                Linking.openURL("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")
              }
            >
              <Text className="text-gray-400 text-xs underline">
                Terms of Use
              </Text>
            </Pressable>
            <Text className="text-gray-600 text-xs">|</Text>
            <Pressable
              onPress={() =>
                Linking.openURL("https://www.apple.com/privacy/")
              }
            >
              <Text className="text-gray-400 text-xs underline">
                Privacy Policy
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
