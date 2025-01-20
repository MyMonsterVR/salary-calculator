export class DanishTaxCalculator {
    monthlyHours: number;
    pensionPercentage: number;
    atp: number;
    amBidrag: number;
    taxRate: number;
    monthlyTaxDeduction: number;
    additional: number;

    constructor({
        monthlyHours = 160.33,
        pensionPercentage = 0.04,
        atp = 99,
        amBidrag = 0.08,
        taxRate = 0.37,
        monthlyTaxDeduction = 4818,
        additional = 81.20
    } = {}) {
        this.monthlyHours = monthlyHours;
        this.pensionPercentage = pensionPercentage;
        this.atp = atp;
        this.amBidrag = amBidrag;
        this.taxRate = taxRate;
        this.monthlyTaxDeduction = monthlyTaxDeduction;
        this.additional = additional;
    }

    calculateMonthly(grossIncome: number, applyFullDeductions = true) {
        grossIncome += this.additional; // Additional adjustment to gross income
        const _grossIncome = grossIncome * 1.05; // Fake gross income with a 5% increase
        let monthlySalary = grossIncome; // Monthly salary
        const pensionDeductionRate = 0.04; // 4% deduction for pension
        const atpContribution = applyFullDeductions ? -this.atp : 0; // ATP-bidrag
        const taxRate = 0.37; // 37%

        // Calculate the 4% pension deduction based on the original monthly salary increased by 5%
        const pensionDeduction = (monthlySalary * 1.05) * pensionDeductionRate;

        // Adjust monthly salary after the pension deduction
        monthlySalary = monthlySalary - pensionDeduction;

        // Calculate AM-bidragsgrundlag (AM Contribution Basis)
        const amBasis = monthlySalary + atpContribution;

        // Calculate AM-bidrag (8%)
        const amContribution = amBasis * 0.08;

        // Calculate A-indkomst (A Income)
        const aIncome = amBasis - amContribution;

        // Calculate Taxable Income
        const taxableIncome = aIncome - (applyFullDeductions ? this.monthlyTaxDeduction : 0);

        // Calculate A-skat
        const incomeTax = taxableIncome * taxRate;

        // Calculate Til udbetaling (Net Payment)
        const netPayment = aIncome - incomeTax;
        
        return {
            grossIncome: Number(grossIncome.toFixed(2)),
            fakeGrossIncome: Number(_grossIncome.toFixed(2)),
            deductions: {
                pension: Number(pensionDeduction.toFixed(2)),
                atp: applyFullDeductions ? this.atp : 0,
                amPension: Number(amContribution.toFixed(2)),
                amBidrag: Number(amContribution.toFixed(2))
            },
            taxableIncome: Number(taxableIncome.toFixed(2)),
            taxDeduction: applyFullDeductions ? this.monthlyTaxDeduction : 0,
            tax: Number(incomeTax.toFixed(2)),
            netIncome: Number(netPayment.toFixed(2))
        };
    }

    calculatePartialMonth(hourlyRate: number, days: number, totalDays: number) {
        // Calculate the proportion of monthly hours based on the number of days worked
        const partialHours = (days / totalDays) * this.monthlyHours;
    
        // Calculate gross income for this period based on partial hours
        const grossIncome = partialHours * hourlyRate;
    
        // Now, calculate the monthly values proportionally, adjusting for partial workdays
        const result = this.calculateMonthly(grossIncome);
    
        // Adjust ATP and tax deduction based on days worked, using the days ratio
        const daysRatio = days / totalDays;
    
        // Adjust the ATP (ATP is a fixed amount, so it's simply proportional to the number of days)
        result.deductions.atp = Number((this.atp * daysRatio).toFixed(2));
    
        // Adjust the monthly tax deduction proportionally for the partial month
        result.taxDeduction = Number((this.monthlyTaxDeduction * daysRatio).toFixed(2));
    
        return result;
    }    
}