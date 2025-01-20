"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator } from "lucide-react";
import { DanishTaxCalculator } from "@/lib/calculator";

const months = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December"
];

type PartialMonthSettings = {
  enabled: boolean;
  fromDate: string;
  toDate: string;
  hourlyRate: string;
  restMonthRate: string;
};

type CalculationResult = {
  grossIncome: number;
  fakeGrossIncome: number;
  deductions: {
    pension: number;
    atp: number;
    amPension: number;
    amBidrag: number;
  };
  taxableIncome: number;
  taxDeduction: number;
  tax: number;
  netIncome: number;
};

export default function Home() {
  const [hourlyRates, setHourlyRates] = useState<{ [key: string]: string }>(
    Object.fromEntries(months.map(month => [month, ""]))
  );
  const [parameters, setParameters] = useState({
    monthlyHours: "160.33",
    pensionPercentage: "0.04",
    atp: "99",
    amBidrag: "0.08",
    taxRate: "0.37",
    monthlyTaxDeduction: "4818",
    additional: "81.20"
  });
  const [partialMonthSettings, setPartialMonthSettings] = useState<{ [key: string]: PartialMonthSettings }>(
    Object.fromEntries(months.map(month => [month, {
      enabled: false,
      fromDate: "",
      toDate: "",
      hourlyRate: "",
      restMonthRate: ""
    }]))
  );
  const [results, setResults] = useState<{ [key: string]: CalculationResult | null }>(
    Object.fromEntries(months.map(month => [month, null]))
  );
  const [yearlyTotals, setYearlyTotals] = useState<CalculationResult | null>(null);

  const handleHourlyRateChange = (month: string, value: string) => {
    setHourlyRates(prev => ({ ...prev, [month]: value }));
  };

  const handleParameterChange = (key: string, value: string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handlePartialMonthToggle = (month: string, enabled: boolean) => {
    setPartialMonthSettings(prev => ({
      ...prev,
      [month]: { ...prev[month], enabled }
    }));
  };

  const handlePartialMonthSettingChange = (month: string, key: string, value: string) => {
    setPartialMonthSettings(prev => ({
      ...prev,
      [month]: { ...prev[month], [key]: value }
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);
  };

  useEffect(() => {
    const calculator = new DanishTaxCalculator({
      monthlyHours: parseFloat(parameters.monthlyHours),
      pensionPercentage: parseFloat(parameters.pensionPercentage),
      atp: parseFloat(parameters.atp),
      amBidrag: parseFloat(parameters.amBidrag),
      taxRate: parseFloat(parameters.taxRate),
      monthlyTaxDeduction: parseFloat(parameters.monthlyTaxDeduction),
      additional: parseFloat(parameters.additional)
    });

    const newResults: { [key: string]: CalculationResult | null } = {};
    const totals: CalculationResult = {
      grossIncome: 0,
      fakeGrossIncome: 0,
      deductions: { pension: 0, atp: 0, amPension: 0, amBidrag: 0 },
      taxableIncome: 0,
      taxDeduction: 0,
      tax: 0,
      netIncome: 0
    };

    months.forEach(month => {
      if (partialMonthSettings[month].enabled) {
        // Handle partial month calculation
        const fromDate = new Date(partialMonthSettings[month].fromDate);
        const toDate = new Date(partialMonthSettings[month].toDate);
        if (fromDate && toDate && partialMonthSettings[month].hourlyRate && partialMonthSettings[month].restMonthRate) {
          const daysInMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();
          const partialDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const restDays = daysInMonth - partialDays;

          const partialResult = calculator.calculatePartialMonth(
            parseFloat(partialMonthSettings[month].hourlyRate),
            partialDays,
            daysInMonth
          );
          const restResult = calculator.calculatePartialMonth(
            parseFloat(partialMonthSettings[month].restMonthRate),
            restDays,
            daysInMonth
          );

          newResults[month] = {
            grossIncome: partialResult.grossIncome + restResult.grossIncome,
            fakeGrossIncome: partialResult.fakeGrossIncome + restResult.fakeGrossIncome,
            deductions: {
              pension: partialResult.deductions.pension + restResult.deductions.pension,
              atp: partialResult.deductions.atp + restResult.deductions.atp,
              amPension: partialResult.deductions.amPension + restResult.deductions.amPension,
              amBidrag: partialResult.deductions.amBidrag + restResult.deductions.amBidrag
            },
            taxableIncome: partialResult.taxableIncome + restResult.taxableIncome,
            taxDeduction: partialResult.taxDeduction + restResult.taxDeduction,
            tax: partialResult.tax + restResult.tax,
            netIncome: partialResult.netIncome + restResult.netIncome
          };
        } else {
          newResults[month] = null;
        }
      } else {
        // Handle regular month calculation
        const hourlyRate = parseFloat(hourlyRates[month]);
        if (!isNaN(hourlyRate)) {
          newResults[month] = calculator.calculateMonthly(hourlyRate * parseFloat(parameters.monthlyHours));
        } else {
          newResults[month] = null;
        }
      }

      // Add to totals if we have results
      if (newResults[month]) {
        totals.grossIncome += newResults[month]!.grossIncome;
        totals.fakeGrossIncome += newResults[month]!.fakeGrossIncome;
        totals.deductions.pension += newResults[month]!.deductions.pension;
        totals.deductions.atp += newResults[month]!.deductions.atp;
        totals.deductions.amPension += newResults[month]!.deductions.amPension;
        totals.deductions.amBidrag += newResults[month]!.deductions.amBidrag;
        totals.taxableIncome += newResults[month]!.taxableIncome;
        totals.taxDeduction += newResults[month]!.taxDeduction;
        totals.tax += newResults[month]!.tax;
        totals.netIncome += newResults[month]!.netIncome;
      }
    });

    setResults(newResults);
    setYearlyTotals(totals);
  }, [hourlyRates, parameters, partialMonthSettings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-center space-x-4">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-center">Lønberegner</h1>
        </div>

        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Timeløn</TabsTrigger>
            <TabsTrigger value="parameters">Indstillinger</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Timeløn pr måned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-8">
                  {months.map(month => (
                    <div key={month} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor={month}>{month}</Label>
                          <Input
                            id={month}
                            type="number"
                            step="0.01"
                            placeholder="Enter hourly rate"
                            value={hourlyRates[month]}
                            onChange={(e) => handleHourlyRateChange(month, e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={partialMonthSettings[month].enabled}
                            onCheckedChange={(checked) => handlePartialMonthToggle(month, checked)}
                          />
                          <Label>Timeløn skift</Label>
                        </div>
                      </div>

                      {partialMonthSettings[month].enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pl-4 border-l-2 border-primary/20">
                          <div className="space-y-2">
                            <Label htmlFor={`${month}-fromDate`}>Fra</Label>
                            <Input
                              id={`${month}-fromDate`}
                              type="date"
                              value={partialMonthSettings[month].fromDate}
                              onChange={(e) => handlePartialMonthSettingChange(month, 'fromDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${month}-toDate`}>Til</Label>
                            <Input
                              id={`${month}-toDate`}
                              type="date"
                              value={partialMonthSettings[month].toDate}
                              onChange={(e) => handlePartialMonthSettingChange(month, 'toDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${month}-partialRate`}>Første rate</Label>
                            <Input
                              id={`${month}-partialRate`}
                              type="number"
                              step="0.01"
                              placeholder="Enter hourly rate"
                              value={partialMonthSettings[month].hourlyRate}
                              onChange={(e) => handlePartialMonthSettingChange(month, 'hourlyRate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${month}-restRate`}>Resten af måneden</Label>
                            <Input
                              id={`${month}-restRate`}
                              type="number"
                              step="0.01"
                              placeholder="Enter hourly rate"
                              value={partialMonthSettings[month].restMonthRate}
                              onChange={(e) => handlePartialMonthSettingChange(month, 'restMonthRate', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {results[month] && (
                        <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                          <h3 className="font-semibold mb-2">Resultater for {month}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p>Bruttoløn: {formatCurrency(results[month]!.grossIncome)}</p>
                            </div>
                            <div>
                              <p>Pension: {formatCurrency(results[month]!.deductions.pension)}</p>
                              <p>ATP: {formatCurrency(results[month]!.deductions.atp)}</p>
                              <p>AM-pension: {formatCurrency(results[month]!.deductions.amPension)}</p>
                              <p>AM-bidrag: {formatCurrency(results[month]!.deductions.amBidrag)}</p>
                            </div>
                            <div>
                              <p>Skatteberettiget løn: {formatCurrency(results[month]!.taxableIncome)}</p>
                              <p>Fradrag: {formatCurrency(results[month]!.taxDeduction)}</p>
                              <p>A-Skat: {formatCurrency(results[month]!.tax)}</p>
                              <p className="font-semibold">Til udbetaling: {formatCurrency(results[month]!.netIncome)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters">
            <Card>
              <CardHeader>
                <CardTitle>Lønberegner Indstillinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(parameters).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <Input
                        id={key}
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => handleParameterChange(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {yearlyTotals && (
          <Card>
            <CardHeader>
              <CardTitle>Årsindkomst</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Indkomst</h3>
                  <p>Nettoløn: {formatCurrency(yearlyTotals.grossIncome)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Fradrag</h3>
                  <p>Pension: {formatCurrency(yearlyTotals.deductions.pension)}</p>
                  <p>ATP: {formatCurrency(yearlyTotals.deductions.atp)}</p>
                  <p>AM-pension: {formatCurrency(yearlyTotals.deductions.amPension)}</p>
                  <p>AM-bidrag: {formatCurrency(yearlyTotals.deductions.amBidrag)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Skat</h3>
                  <p>Skatteberettiget løn: {formatCurrency(yearlyTotals.taxableIncome)}</p>
                  <p>Skatte Fradrag: {formatCurrency(yearlyTotals.taxDeduction)}</p>
                  <p>A-Skat: {formatCurrency(yearlyTotals.tax)}</p>
                  <p className="font-semibold text-lg">Netto løn: {formatCurrency(yearlyTotals.netIncome)}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Gennemsnits månedsløn: {formatCurrency(yearlyTotals.netIncome / 12)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}