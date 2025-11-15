"use client";

import * as React from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { FormField } from "../../components/FormField";
import { Tabs } from "../../components/Tabs";

export default function StyleGuidePage() {
  const [activeTab, setActiveTab] = React.useState("account");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">
            UI Style Guide
          </h1>
          <p className="text-sm text-slate-400">
            Starter components for Galaxy Forge & dashboards
          </p>
        </header>

        {/* Buttons */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
            </div>
          </div>
        </Card>

        {/* Form fields */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Form Fields</h2>
          <div className="space-y-4">
            <FormField
              label="Display name"
              htmlFor="displayName"
              description="Shown on dashboards and in tables."
              required
            >
              <Input id="displayName" placeholder="E.g. G.O.D of Shifting Tides" />
            </FormField>

            <FormField
              label="Email"
              htmlFor="email"
              description="Used for login and notifications."
            >
              <Input id="email" type="email" placeholder="you@example.com" />
            </FormField>

            <FormField
              label="World Name"
              htmlFor="worldName"
              description="This one shows the error state."
              error="World name is required."
              required
            >
              <Input
                id="worldName"
                placeholder="E.g. Serrian Prime"
                hasError
              />
            </FormField>
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Tabs</h2>
          <Tabs
            tabs={[
              { id: "account", label: "Account" },
              { id: "profile", label: "Profile" },
              { id: "galaxy", label: "Galaxy Forge", badgeCount: 3 },
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />

          <div className="mt-4 text-sm text-slate-300">
            {activeTab === "account" && (
              <p>Account settings preview.</p>
            )}
            {activeTab === "profile" && (
              <p>User profile preview.</p>
            )}
            {activeTab === "galaxy" && (
              <p>Galaxy Forge preview (worlds, eras, settings...).</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
