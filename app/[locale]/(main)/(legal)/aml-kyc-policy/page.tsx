import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background pt-4 pb-[70px] sm:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            AML/KYC Policy
          </h1>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-6 sm:p-8">
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
            
            <section className="mb-8">
              <p className="mb-4">
                1. Anti-Money Laundering and Know Your Customer Policy (hereinafter - the “AML/KYC Policy”) is designated to prevent and mitigate all possible risks of the Company being involved in any kind of illegal activity.
              </p>
              <p className="mb-4">
                2. The Company is fully committed to be constantly vigilant to prevent money laundering and combat the financing of terrorism in order to minimize and manage risks such as the risks to its reputational risk, legal risk and regulatory risk.
              </p>
              <p className="mb-4">
                3. To protect the funds of our Customers and ensure compliance with international trade standards, the Company operates exclusively in accordance with the laws on combating money laundering and countering the financing of terrorism and criminal activities. This Policy aims to comply with the rules and guidance’s contained in the following laws, namely the National Ordinance Penalization of Money Laundering (NOPML), the National Ordinance on the Reporting of Unusual Transactions (NORUT0), the National Ordinance on Identification of clients when Rendering Services (NOIS), Directive (EU) 2018/843 and the FATF recommendations.
              </p>
              <p className="mb-4">
                4. To monitor in accordance with the legal requirements, the Company has established a Compliance Department that develops Anti-money laundering measures and Know Your Customer procedures (AML / KYC), which are obligatory for all employees of the Company. The Department also determines the policy of engagement with those registered and holding accounts (hereinafter – “the Customers”) on the Company website (hereinafter – “the Website”).
              </p>
              <p className="mb-4">
                5. The Compliance Department is intended to ensure that all the operations of the Company are consistent with the international standards for combating money laundering and terrorist financing and that all the documents provided by the Customer are up to date and fully comply with the relevant legal requirements. As a result, by opening an account on the Website the Customer unconditionally accepts the Company policy, agrees with the following rules and undertakes to observe them.
              </p>
              <p className="mb-4">
                6. The Company has a list of documents which must be provided by the Customer for the purpose of identity verification, namely: a color copy of the passport (the first two pages with pictures and details, as well as the page with the residential address stamp, if there is one) or a color copy of the national ID card. Upon the request of the Company additional documents must be provided: a copy of the Customer’s driver’s license, utility bills (as proof of address). The verification process also involves mandatory confirmation of the Customer’s phone number. The Company reserves the right to request additional documentation if it deems necessary upon times in order to complete their AML checks and compliance standards.
              </p>
              <p className="mb-4">
                7. Withdrawals from the Customer’s account are allowed only after the Customer’s identity has been verified on the basis of the documentation provided and a completed questionnaire. Withdrawals can be made only to the account belonging to a person identified as a Customer of the Company (personal account holder on the Website). Withdrawal of funds to third parties are prohibited. Internal transfers between Customers are also forbidden.
              </p>
              <p className="mb-4">
                8. The Company is obliged to share information about the Customer with financial institutions and law enforcement agencies, as required by the applicable laws, and has the right to do so without obtaining prior consent. By using the Website, the Customer gives the Company his/her consent to perform these actions. In compliance with this paragraph, the Company holds all information about the Customer and his/her betting history, payment transactions for at least five years.
              </p>
              <p className="mb-4">
                9. The Customer undertakes to respect the legal norms, including international norms which aim to combat illegal money transfers, financial fraud, money laundering and legalization of funds obtained by illegal means.
              </p>
              <p className="mb-4">
                10. The Customer undertakes to make every effort to avoid direct or indirect complicity in illegal financial activities and any other illegal transactions using the Website.
              </p>
              <p className="mb-4">
                11. The Customer guarantees the legal origin, legal ownership and the right to use the funds deposited to their account.
              </p>
              <p className="mb-4">
                12. If evidence of suspicious transactions is discovered on the Customer’s account, cash deposits from questionable sources (for example, when details of the sender and the account holder do not match) and/or any actions with signs of fraud (including any refunds or cancellation of payments), the Company reserves the right to conduct an internal investigation, block or close the Customer’s account, cancel any payments and suspend operations on the account until the end of the official investigation. When making a decision the Company is guided by the provisions of the applicable law.
              </p>
              <p className="mb-4">
                13. The Company has the right to request additional information about the Customer if the withdrawal method is different from the deposit method. The Company also reserves the right to block the Customer’s account during the investigation if the Customer refuses to provide additional information as requested by the Company.
              </p>
              <p className="mb-4">
                14. In the course of investigation, the Company has the right to request additional copies of the Customer’s identity confirmation documents and copies of bank cards used to top up the account, copies of payment documents and other documents confirming the lawful possession and legal origin of the funds. The Company also has the right to request the original documents.
              </p>
              <p className="mb-4">
                15. The Company is obliged to exercise extensive scrutiny to Customers classified as a high-risk jurisdiction.
              </p>
              <p className="mb-4">
                16. The Company’s refusal to perform transactions which are considered by the Company as suspicious (including the blocking or closing of the Customer’s account) does not constitute to be a ground for civil liability of the Company for failure to fulfil obligations to the Customer.
              </p>
              <p className="mb-4">
                17. The Company is not obliged to inform Customers or other individuals about measures taken to counter the legalization (laundering) of proceeds from crime and terrorist financing. Exceptions could be the following: when informing Customers about the suspension of a particular service, the refusal to carry out a Customer’s request or open an account, and when requesting documents from the Customer.
              </p>
              <p>
                This anti-money laundering policy is an integral part of the Customer Agreement governing the terms by which the Customer opens an account on the Website.
              </p>
            </section>

            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t">
              <Link 
                href="/terms-and-conditions" 
                className="text-primary hover:underline"
              >
                Terms and Conditions
              </Link>
              <Link 
                href="/privacy-policy" 
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/public-offers" 
                className="text-primary hover:underline"
              >
                Public Offers
              </Link>
              <Link 
                href="/support" 
                className="text-primary hover:underline"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}