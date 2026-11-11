describe("LedgerLine Money Calculations", () => {

    test("should calculate withdrawal correctly", () => {
        const balance = 50000; // ₹500 in paise
        const withdrawal = 10050; // ₹100.50 in paise

        const remainingBalance = balance - withdrawal;

        expect(remainingBalance).toBe(39950);
    });

    test("should calculate deposit correctly", () => {
        const balance = 50000;
        const deposit = 5075; // ₹50.75

        const newBalance = balance + deposit;

        expect(newBalance).toBe(55075);
    });

    test("should preserve money during transfer", () => {
        const senderBalance = 50000;
        const receiverBalance = 20000;
        const transferAmount = 10025; // ₹100.25

        const totalBefore = senderBalance + receiverBalance;

        const newSenderBalance = senderBalance - transferAmount;
        const newReceiverBalance = receiverBalance + transferAmount;

        const totalAfter = newSenderBalance + newReceiverBalance;

        expect(totalAfter).toBe(totalBefore);
    });

});