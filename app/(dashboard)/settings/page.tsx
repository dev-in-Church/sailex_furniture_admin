"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("store");
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Sailex Furnitures",
    storeEmail: "info@sailexfurnitures.com",
    storePhone: "+254 700 000 000",
    storeAddress: "Nairobi, Kenya",
    currency: "KES",
    taxRate: "16",
  });

  const [paymentSettings, setPaymentSettings] = useState({
    mpesaEnabled: true,
    mpesaShortcode: "174379",
    mpesaPasskey: "",
    stripeEnabled: true,
    stripePublishableKey: "",
    stripeSecretKey: "",
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: "50000",
    standardShippingRate: "500",
    expressShippingRate: "1500",
    estimatedDeliveryDays: "3-5",
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    lowStock: true,
    reviews: true,
    weeklyReports: false,
  });

  const handleSave = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    alert("Settings saved successfully!");
  };

  const tabs = [
    { id: "store", label: "Store" },
    { id: "payments", label: "Payments" },
    { id: "shipping", label: "Shipping" },
    { id: "notifications", label: "Notifications" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Store Tab */}
      {activeTab === "store" && (
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Basic information about your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="storeName" className="text-sm font-medium">
                  Store Name
                </label>
                <Input
                  id="storeName"
                  value={storeSettings.storeName}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      storeName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="storeEmail" className="text-sm font-medium">
                  Store Email
                </label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={storeSettings.storeEmail}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      storeEmail: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="storePhone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="storePhone"
                  value={storeSettings.storePhone}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      storePhone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                </label>
                <Input
                  id="currency"
                  value={storeSettings.currency}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      currency: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="storeAddress" className="text-sm font-medium">
                Address
              </label>
              <textarea
                id="storeAddress"
                value={storeSettings.storeAddress}
                onChange={(e) =>
                  setStoreSettings({
                    ...storeSettings,
                    storeAddress: e.target.value,
                  })
                }
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="taxRate" className="text-sm font-medium">
                Tax Rate (%)
              </label>
              <Input
                id="taxRate"
                type="number"
                value={storeSettings.taxRate}
                onChange={(e) =>
                  setStoreSettings({
                    ...storeSettings,
                    taxRate: e.target.value,
                  })
                }
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa Settings</CardTitle>
              <CardDescription>
                Configure Daraja M-Pesa integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable M-Pesa</p>
                  <p className="text-sm text-muted-foreground">
                    Accept payments via M-Pesa
                  </p>
                </div>
                <button
                  onClick={() =>
                    setPaymentSettings({
                      ...paymentSettings,
                      mpesaEnabled: !paymentSettings.mpesaEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    paymentSettings.mpesaEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      paymentSettings.mpesaEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {paymentSettings.mpesaEnabled && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Business Shortcode
                    </label>
                    <Input
                      value={paymentSettings.mpesaShortcode}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          mpesaShortcode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Passkey</label>
                    <Input
                      type="password"
                      value={paymentSettings.mpesaPasskey}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          mpesaPasskey: e.target.value,
                        })
                      }
                      placeholder="Enter your M-Pesa passkey"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stripe Settings</CardTitle>
              <CardDescription>
                Configure Stripe for card payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Stripe</p>
                  <p className="text-sm text-muted-foreground">
                    Accept card payments via Stripe
                  </p>
                </div>
                <button
                  onClick={() =>
                    setPaymentSettings({
                      ...paymentSettings,
                      stripeEnabled: !paymentSettings.stripeEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    paymentSettings.stripeEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      paymentSettings.stripeEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {paymentSettings.stripeEnabled && (
                <div className="grid gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Publishable Key
                    </label>
                    <Input
                      value={paymentSettings.stripePublishableKey}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          stripePublishableKey: e.target.value,
                        })
                      }
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Key</label>
                    <Input
                      type="password"
                      value={paymentSettings.stripeSecretKey}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          stripeSecretKey: e.target.value,
                        })
                      }
                      placeholder="sk_test_..."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Options</CardTitle>
            <CardDescription>
              Configure shipping rates and delivery options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Free Shipping Threshold (KES)
                </label>
                <Input
                  type="number"
                  value={shippingSettings.freeShippingThreshold}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      freeShippingThreshold: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Orders above this amount get free shipping
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Standard Shipping Rate (KES)
                </label>
                <Input
                  type="number"
                  value={shippingSettings.standardShippingRate}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      standardShippingRate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Express Shipping Rate (KES)
                </label>
                <Input
                  type="number"
                  value={shippingSettings.expressShippingRate}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      expressShippingRate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Estimated Delivery (days)
                </label>
                <Input
                  value={shippingSettings.estimatedDeliveryDays}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      estimatedDeliveryDays: e.target.value,
                    })
                  }
                  placeholder="3-5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Configure email notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: "newOrders",
                label: "New Order Notifications",
                desc: "Receive email when a new order is placed",
              },
              {
                key: "lowStock",
                label: "Low Stock Alerts",
                desc: "Get notified when products are running low",
              },
              {
                key: "reviews",
                label: "Customer Reviews",
                desc: "Receive notifications for new reviews",
              },
              {
                key: "weeklyReports",
                label: "Weekly Reports",
                desc: "Receive weekly sales and analytics reports",
              },
            ].map((item, index) => (
              <div
                key={item.key}
                className={`flex items-center justify-between py-2 ${index > 0 ? "border-t" : ""}`}
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      [item.key]:
                        !notifications[item.key as keyof typeof notifications],
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications]
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[item.key as keyof typeof notifications]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
