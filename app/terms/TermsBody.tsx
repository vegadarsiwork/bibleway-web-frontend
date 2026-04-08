"use client";

/* ------------------------------------------------------------------ */
/*  Reusable typography primitives                                     */
/* ------------------------------------------------------------------ */

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-headline text-2xl text-on-surface mt-10 mb-3">
      {children}
    </h3>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-semibold text-base text-on-surface mt-5 mb-2">
      {children}
    </h4>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-on-surface-variant mb-3">
      {children}
    </p>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-sm text-on-surface-variant mb-3 marker:text-primary/60">
      {children}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Body content (no outer wrappers — works in page or modal)          */
/* ------------------------------------------------------------------ */

export default function TermsBody() {
  return (
    <>
      {/* Title block */}
      <div className="text-center pb-8 mb-8 border-b border-outline-variant/15">
        <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
          BibleWay
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl text-on-surface mb-2">
          Terms and Conditions of Use
        </h2>
        <p className="text-sm text-on-surface-variant">
          A Christian Community Application
        </p>
        <p className="text-xs text-on-surface-variant/70 mt-3">
          Effective Date: January 1, 2025 &middot; Version 1.0
        </p>
      </div>

      {/* Notice block */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 mb-10">
        <p className="text-sm font-semibold text-on-surface leading-relaxed">
          PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THIS
          APPLICATION. BY ACCESSING OR USING BIBLEWAY, YOU AGREE TO BE LEGALLY
          BOUND BY THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THIS
          APPLICATION.
        </p>
      </div>

      {/* 1 */}
      <section>
        <H2>1. About BibleWay</H2>
        <P>
          BibleWay (&ldquo;the App,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo;
          or &ldquo;us&rdquo;) is a faith-based digital community platform
          designed to connect Christians worldwide through fellowship, prayer,
          biblical education, and spiritual growth. The App is operated and
          maintained by BibleWay Technologies (hereafter &ldquo;the
          Company&rdquo;).
        </P>
        <P>BibleWay provides the following core features:</P>
        <UL>
          <li>
            <strong className="text-on-surface">Community Chat</strong> —
            Private and group messaging between verified users
          </li>
          <li>
            <strong className="text-on-surface">Social Feed</strong> — Photo
            and caption sharing with commenting functionality
          </li>
          <li>
            <strong className="text-on-surface">Prayer Requests</strong> — A
            dedicated space to share, receive, and respond to prayer needs
          </li>
          <li>
            <strong className="text-on-surface">Biblical Games</strong> —
            Interactive, scripture-based educational games
          </li>
          <li>
            <strong className="text-on-surface">Age-Segmented Bible</strong> —
            Curated Bible editions tailored to children, youth, and adults
          </li>
          <li>
            <strong className="text-on-surface">Bible Reading</strong> — Full
            Bible access with reading plans and bookmarking
          </li>
        </UL>
      </section>

      {/* 2 */}
      <section>
        <H2>2. Acceptance of Terms</H2>
        <P>
          By downloading, installing, registering for, or using BibleWay, you
          affirm that:
        </P>
        <UL>
          <li>
            You are at least 13 years of age, or if under 13, you have
            obtained verifiable parental consent as outlined in Section 6
            (Minor Users &amp; Parental Consent).
          </li>
          <li>You have the legal capacity to enter into a binding agreement.</li>
          <li>
            You have read, understood, and agree to be bound by these Terms
            and Conditions, our Privacy Policy, and our Community Standards.
          </li>
          <li>
            You are not prohibited from using the App under the laws of your
            jurisdiction.
          </li>
        </UL>
        <P>
          Your continued use of the App following any revision of these Terms
          constitutes acceptance of such revisions. We will notify users of
          material changes via in-app notification and/or email.
        </P>
      </section>

      {/* 3 */}
      <section>
        <H2>3. Account Registration &amp; Security</H2>

        <H3>3.1 Registration Requirements</H3>
        <P>
          You must provide accurate, complete, and current information during
          registration. You are strictly prohibited from:
        </P>
        <UL>
          <li>
            Creating an account using a false identity, pseudonym intended to
            deceive, or another person&rsquo;s information.
          </li>
          <li>
            Creating multiple accounts for the same individual without express
            written consent from BibleWay.
          </li>
          <li>
            Registering on behalf of a minor without disclosing their age and
            obtaining appropriate parental consent.
          </li>
          <li>Using automated tools, bots, or scripts to create accounts.</li>
        </UL>

        <H3>3.2 Account Security</H3>
        <P>
          You are solely responsible for maintaining the confidentiality of
          your login credentials. You agree to:
        </P>
        <UL>
          <li>
            Use a strong, unique password and not share it with any third
            party.
          </li>
          <li>
            Immediately notify BibleWay at security@bibleway.app of any
            unauthorized access or suspected breach.
          </li>
          <li>Log out of your account after each session on shared devices.</li>
        </UL>
        <P>
          BibleWay shall not be liable for any loss or damage arising from
          your failure to maintain adequate account security.
        </P>

        <H3>3.3 Account Termination</H3>
        <P>
          BibleWay reserves the right to suspend or permanently terminate any
          account, at its sole discretion, without prior notice, for
          violations of these Terms, applicable law, or behavior deemed
          harmful to the community.
        </P>
      </section>

      {/* 4 */}
      <section>
        <H2>4. Community Standards &amp; Prohibited Conduct</H2>
        <P>
          BibleWay is a sacred community space grounded in Christian values.
          All users are expected to interact with grace, respect, and
          integrity. The following conduct is{" "}
          <strong className="text-on-surface">STRICTLY PROHIBITED</strong> and
          may result in immediate account termination, content removal, and/or
          referral to law enforcement:
        </P>

        <H3>4.1 Religious Integrity Violations</H3>
        <UL>
          <li>
            Posting, sharing, or promoting content that mocks, blasphemes, or
            deliberately disrespects Christianity, other faiths, or religious
            figures.
          </li>
          <li>
            Spreading theological misinformation, false doctrine, or
            heretical teachings misrepresented as biblical truth.
          </li>
          <li>
            Impersonating pastors, spiritual leaders, theologians, or other
            religious authorities.
          </li>
          <li>
            Using the platform to recruit members into cults, sects, or
            organizations contrary to Christian principles.
          </li>
          <li>
            Promoting occultism, witchcraft, satanism, or any anti-Christian
            spiritual practice.
          </li>
        </UL>

        <H3>4.2 Hate Speech &amp; Discrimination</H3>
        <UL>
          <li>
            Publishing or distributing content that promotes hatred, violence,
            or discrimination based on race, ethnicity, gender, sexual
            orientation, disability, nationality, age, or religion.
          </li>
          <li>
            Using slurs, derogatory language, or dehumanizing rhetoric against
            any individual or group.
          </li>
          <li>
            Posting content that calls for violence against any person, group,
            or institution.
          </li>
        </UL>

        <H3>4.3 Sexual &amp; Inappropriate Content</H3>
        <UL>
          <li>
            Uploading, sharing, or linking to pornographic, sexually explicit,
            or sexually suggestive content of any kind.
          </li>
          <li>
            Sending unsolicited sexual messages, advances, or graphic content
            to any user.
          </li>
          <li>
            Sharing content that sexualizes minors in any form — this
            constitutes a criminal offense and will be immediately reported to
            law enforcement and relevant child protection agencies.
          </li>
          <li>
            Posting content that glorifies, normalizes, or promotes sexual
            immorality, including content that conflicts with the
            platform&rsquo;s faith-based values.
          </li>
        </UL>

        <H3>4.4 Harassment, Bullying &amp; Abuse</H3>
        <UL>
          <li>
            Targeting, stalking, threatening, intimidating, or harassing any
            user inside or outside the App.
          </li>
          <li>
            Engaging in cyberbullying, coordinated attacks, or pile-on
            behavior toward any individual.
          </li>
          <li>
            Using the prayer request feature to mock, ridicule, or expose
            sensitive personal information shared in confidence.
          </li>
          <li>
            Creating fake accounts or impersonating other users to harass
            them.
          </li>
          <li>
            Doxxing — sharing private personal information (addresses, phone
            numbers, workplaces) of any individual without their consent.
          </li>
        </UL>

        <H3>4.5 Spam, Fraud &amp; Misinformation</H3>
        <UL>
          <li>
            Sending unsolicited bulk messages, chain letters, or spam through
            any feature of the App.
          </li>
          <li>
            Posting fraudulent, deceptive, or misleading content, including
            false miracle claims or fabricated testimonies.
          </li>
          <li>
            Soliciting donations, financial contributions, or investments
            through the platform without the prior written authorization of
            BibleWay.
          </li>
          <li>
            Impersonating BibleWay staff, moderators, or customer support.
          </li>
          <li>
            Posting false or misleading medical, legal, or financial advice,
            particularly when framed as spiritual guidance.
          </li>
        </UL>

        <H3>4.6 Illegal &amp; Harmful Activities</H3>
        <UL>
          <li>
            Using the App to plan, facilitate, or promote any illegal
            activity, including but not limited to fraud, extortion, drug
            trafficking, or human trafficking.
          </li>
          <li>
            Sharing content that promotes or glorifies self-harm, suicide,
            eating disorders, or substance abuse.
          </li>
          <li>
            Uploading content that infringes on third-party intellectual
            property rights, including copyrighted music, images, text, or
            scripture translations under license.
          </li>
          <li>
            Using the App for unauthorized commercial purposes, including
            selling products or services without BibleWay&rsquo;s prior
            written approval.
          </li>
          <li>
            Attempting to compromise the App&rsquo;s security, reverse-engineer
            its code, or introduce malware, viruses, or malicious code.
          </li>
        </UL>

        <H3>4.7 Political Misuse</H3>
        <UL>
          <li>
            Using the platform to campaign for political parties, political
            candidates, or political ideologies.
          </li>
          <li>
            Distributing partisan political propaganda, misinformation, or
            election-related content.
          </li>
        </UL>
      </section>

      {/* 5 */}
      <section>
        <H2>5. Prayer Requests — Special Provisions</H2>
        <P>
          The Prayer Request feature is a sacred and sensitive space. Users
          who share prayer requests do so in an act of vulnerability and
          trust. The following additional rules apply:
        </P>
        <UL>
          <li>
            Prayer requests and responses must be offered in sincere faith,
            compassion, and confidentiality.
          </li>
          <li>
            It is strictly prohibited to screenshot, share, or republish
            another user&rsquo;s prayer request outside the App without their
            express written consent.
          </li>
          <li>
            Users must not use prayer requests to gossip about, shame, or
            embarrass third parties.
          </li>
          <li>
            Responding to prayer requests with unsolicited financial
            solicitations, product promotions, or spam is prohibited.
          </li>
          <li>
            False, fabricated, or manipulative prayer requests designed to
            exploit community sympathy are a violation of these Terms.
          </li>
          <li>
            Any prayer request that reveals information suggesting imminent
            danger to a person&rsquo;s life may be reported to emergency
            services by BibleWay without prior notice to the user.
          </li>
        </UL>
      </section>

      {/* 6 */}
      <section>
        <H2>6. Minor Users &amp; Parental Consent</H2>
        <P>
          BibleWay offers age-appropriate Bible content for children and
          youth. In recognition of our special duty of care toward minors, the
          following provisions apply:
        </P>
        <UL>
          <li>
            Children under 13 years of age are{" "}
            <strong className="text-on-surface">PROHIBITED</strong> from
            creating independent accounts. A parent or legal guardian must
            create and manage the account on the child&rsquo;s behalf.
          </li>
          <li>
            Users between the ages of 13 and 17 (&ldquo;Minors&rdquo;) may
            register with verifiable parental consent.
          </li>
          <li>
            Parents and guardians are solely responsible for supervising the
            App usage of minors in their care.
          </li>
          <li>
            Any user who knowingly facilitates, encourages, or engages in
            inappropriate communication with a minor will be permanently
            banned and reported to law enforcement.
          </li>
          <li>
            BibleWay does not knowingly collect personal data from children
            under 13 without verifiable parental consent. If we discover such
            data has been collected, it will be deleted immediately.
          </li>
          <li>
            BibleWay reserves the right to restrict any user&rsquo;s access to
            features when there is reason to believe the user may be a minor
            accessing adult-designated content.
          </li>
        </UL>
      </section>

      {/* 7 */}
      <section>
        <H2>7. User-Generated Content (UGC)</H2>

        <H3>7.1 Ownership &amp; License</H3>
        <P>
          You retain ownership of all original content you post to BibleWay
          (&ldquo;User Content&rdquo;). However, by posting content, you grant
          BibleWay a non-exclusive, worldwide, royalty-free, sublicensable,
          and transferable license to use, host, store, reproduce, modify,
          adapt, display, and distribute your User Content solely for the
          purpose of operating and improving the App.
        </P>

        <H3>7.2 Content Representations</H3>
        <P>By submitting User Content, you represent and warrant that:</P>
        <UL>
          <li>
            You own the content or have obtained all necessary rights and
            permissions to post it.
          </li>
          <li>
            The content does not infringe any third-party intellectual
            property rights.
          </li>
          <li>
            The content does not violate any applicable law, including
            copyright, defamation, or privacy laws.
          </li>
          <li>
            You have obtained the consent of any identifiable individuals
            depicted in photos or videos.
          </li>
        </UL>

        <H3>7.3 Content Moderation</H3>
        <P>
          BibleWay reserves the right, but not the obligation, to review,
          moderate, remove, or restrict any User Content at its sole
          discretion without prior notice. BibleWay is not liable for the
          accuracy, completeness, or appropriateness of any User Content
          posted by users.
        </P>
      </section>

      {/* 8 */}
      <section>
        <H2>8. Biblical Games — Specific Rules</H2>
        <P>
          The Biblical Games feature is designed for spiritual education and
          wholesome entertainment. The following apply:
        </P>
        <UL>
          <li>
            Games are non-monetary. No real-money gambling, wagering, staking,
            or prize-based competitions involving monetary value are permitted
            on this platform.
          </li>
          <li>
            Virtual points or rewards earned in games have no real-world
            monetary value and cannot be redeemed, transferred, traded, or
            sold.
          </li>
          <li>
            Users may not exploit bugs, glitches, hacks, or third-party tools
            to gain unfair advantages in games.
          </li>
          <li>
            Communicating harassing, abusive, or offensive messages through
            game interaction features is prohibited.
          </li>
          <li>
            BibleWay reserves the right to reset, adjust, or remove game
            scores and rewards at its discretion.
          </li>
        </UL>
      </section>

      {/* 9 */}
      <section>
        <H2>9. Bible Reading &amp; Age-Segmented Content</H2>
        <P>
          BibleWay provides Bible content under licenses from approved Bible
          translation publishers. You agree that:
        </P>
        <UL>
          <li>
            Bible text, reading plans, and devotionals are for personal,
            non-commercial spiritual use only.
          </li>
          <li>
            Systematic bulk downloading, scraping, or reproduction of Bible
            text for redistribution is prohibited without the express written
            permission of BibleWay and the relevant Bible translation
            copyright holders.
          </li>
          <li>
            Users must not alter, distort, or misrepresent Bible text in any
            posted content.
          </li>
          <li>
            Age-segmented content is provided based on user-declared age.
            Users who falsify their age to access content intended for a
            different age group do so in violation of these Terms.
          </li>
        </UL>
      </section>

      {/* 10 */}
      <section>
        <H2>10. Privacy &amp; Data Protection</H2>
        <P>
          Your privacy is paramount to us. Our full Privacy Policy
          (incorporated by reference into these Terms) governs how we collect,
          store, use, and share your personal data. Key highlights:
        </P>
        <UL>
          <li>
            BibleWay collects only the data necessary to provide and improve
            its services.
          </li>
          <li>
            We do not sell, rent, or trade your personal data to third-party
            advertisers.
          </li>
          <li>
            Prayer requests, private messages, and personal testimonies are
            treated with the highest degree of confidentiality.
          </li>
          <li>
            In circumstances where BibleWay has a reasonable belief that a
            user faces imminent risk of serious harm, we may disclose relevant
            information to appropriate authorities.
          </li>
          <li>
            Users may request access to, correction of, or deletion of their
            personal data by contacting privacy@bibleway.app, subject to
            applicable legal retention obligations.
          </li>
          <li>
            Data may be stored on servers located outside your country of
            residence. By using the App, you consent to such cross-border data
            transfers, which are conducted in compliance with applicable data
            protection law.
          </li>
        </UL>
      </section>

      {/* 11 */}
      <section>
        <H2>11. Intellectual Property</H2>
        <P>
          All content, design, software, logos, trademarks, and materials
          created by BibleWay are the exclusive property of BibleWay
          Technologies and are protected by applicable intellectual property
          laws. You agree not to:
        </P>
        <UL>
          <li>
            Copy, reproduce, distribute, or create derivative works from
            BibleWay&rsquo;s proprietary content without express written
            permission.
          </li>
          <li>
            Use BibleWay&rsquo;s name, logo, or branding in any manner that
            implies endorsement or affiliation without written consent.
          </li>
          <li>
            Reverse engineer, decompile, or disassemble the App&rsquo;s source
            code.
          </li>
        </UL>
      </section>

      {/* 12 */}
      <section>
        <H2>12. Disclaimers &amp; Limitation of Liability</H2>

        <H3>12.1 No Professional Advice</H3>
        <P>
          Content on BibleWay — including biblical commentary, prayer
          responses, and community posts — does not constitute professional
          medical, legal, psychological, financial, or therapeutic advice.
          Users should consult qualified professionals for such needs.
          BibleWay is not responsible for decisions made based on community
          content.
        </P>

        <H3>12.2 User Interactions</H3>
        <P>
          BibleWay is not responsible for the conduct of its users, whether
          online or offline. You interact with other users at your own risk.
          BibleWay strongly advises against sharing sensitive personal
          information such as home addresses, phone numbers, financial
          details, or travel plans with other users.
        </P>

        <H3>12.3 Service Availability</H3>
        <P>
          BibleWay does not guarantee uninterrupted, error-free, or continuous
          availability of the App. Scheduled maintenance, updates, or
          unforeseen outages may temporarily affect access.
        </P>

        <H3>12.4 Limitation of Liability</H3>
        <P>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BIBLEWAY AND ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES ARISING OUT OF YOUR USE OF, OR INABILITY TO USE, THE APP,
          EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT
          SHALL BIBLEWAY&rsquo;S TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU
          PAID, IF ANY, TO ACCESS THE APP IN THE TWELVE (12) MONTHS PRECEDING
          THE CLAIM.
        </P>
      </section>

      {/* 13 */}
      <section>
        <H2>13. Reporting, Enforcement &amp; Appeals</H2>
        <P>
          BibleWay is committed to maintaining a safe and holy digital
          environment. We employ both automated systems and human moderation
          to enforce these Terms.
        </P>

        <H3>13.1 Reporting Violations</H3>
        <P>
          Users are encouraged to report violations using the in-app
          &ldquo;Report&rdquo; function or by emailing safety@bibleway.app.
          Reports are reviewed as promptly as possible, with priority given to
          reports involving minors, threats, or illegal activity.
        </P>

        <H3>13.2 Enforcement Actions</H3>
        <P>
          Depending on the severity of the violation, BibleWay may take the
          following actions:
        </P>
        <UL>
          <li>Content removal</li>
          <li>Temporary feature restriction</li>
          <li>Account suspension (24 hours to 30 days)</li>
          <li>Permanent account termination</li>
          <li>
            Referral to law enforcement and/or child protection agencies
          </li>
          <li>Disclosure of user data as required by law</li>
        </UL>

        <H3>13.3 Appeals</H3>
        <P>
          Users who believe an enforcement action was taken in error may
          submit an appeal within 14 calendar days of the action by emailing
          appeals@bibleway.app with their account details and grounds for
          appeal. BibleWay will review appeals and respond within 10 business
          days. All appeal decisions are final.
        </P>
      </section>

      {/* 14 */}
      <section>
        <H2>14. Indemnification</H2>
        <P>
          You agree to indemnify, defend, and hold harmless BibleWay
          Technologies, its directors, officers, employees, agents, and
          licensors from and against any and all claims, damages, losses,
          liabilities, costs, and expenses (including reasonable
          attorneys&rsquo; fees) arising out of or relating to:
        </P>
        <UL>
          <li>Your use or misuse of the App.</li>
          <li>Your User Content.</li>
          <li>Your violation of these Terms and Conditions.</li>
          <li>
            Your violation of any applicable law or the rights of any third
            party.
          </li>
        </UL>
      </section>

      {/* 15 */}
      <section>
        <H2>15. Governing Law &amp; Dispute Resolution</H2>
        <P>
          These Terms shall be governed by and construed in accordance with
          the laws of the jurisdiction in which BibleWay Technologies is
          incorporated, without regard to conflict-of-law principles.
        </P>
        <P>
          Any dispute, claim, or controversy arising out of or relating to
          these Terms or the App shall first be attempted to be resolved
          through good-faith negotiation. If unresolved within 30 days, the
          dispute shall be submitted to binding arbitration under the rules of
          a recognized arbitration body in the applicable jurisdiction.
        </P>
        <P>
          Notwithstanding the above, BibleWay reserves the right to seek
          injunctive or other equitable relief in any court of competent
          jurisdiction to prevent actual or threatened violation of its
          intellectual property rights or to address matters involving
          imminent harm.
        </P>
      </section>

      {/* 16 */}
      <section>
        <H2>16. Modifications to the App &amp; Terms</H2>
        <P>BibleWay reserves the right to:</P>
        <UL>
          <li>
            Modify, suspend, or discontinue any feature or the entirety of the
            App at any time without liability.
          </li>
          <li>
            Update these Terms and Conditions at any time. Material updates
            will be communicated via in-app notice, push notification, or
            registered email at least 14 days before taking effect, where
            practicable.
          </li>
        </UL>
        <P>
          Your continued use of the App after the effective date of any
          revision constitutes your acceptance of the updated Terms.
        </P>
      </section>

      {/* 17 */}
      <section>
        <H2>17. Third-Party Services &amp; Links</H2>
        <P>
          The App may contain links to or integrations with third-party
          websites, services, or content. BibleWay does not endorse, control,
          or take responsibility for any third-party content, products, or
          services. Accessing third-party platforms from within the App is at
          your own risk and subject to their respective terms and privacy
          policies.
        </P>
      </section>

      {/* 18 */}
      <section>
        <H2>18. Termination</H2>
        <P>
          You may terminate your account at any time by navigating to{" "}
          <em>Settings &gt; Account &gt; Delete Account</em> or by contacting
          support@bibleway.app. Upon termination:
        </P>
        <UL>
          <li>
            Your profile and personal information will be deleted in
            accordance with our Privacy Policy.
          </li>
          <li>
            Content you posted to public areas (social feed, prayer requests)
            may be retained in anonymized form unless you specifically request
            deletion.
          </li>
          <li>
            Provisions of these Terms that by their nature should survive
            termination (including intellectual property, indemnification, and
            limitation of liability provisions) shall survive.
          </li>
        </UL>
      </section>

      {/* 19 */}
      <section>
        <H2>19. Crisis &amp; Emergency Provisions</H2>
        <P>
          BibleWay takes the safety of its community members extremely
          seriously. If you or another user appears to be in immediate danger:
        </P>
        <UL>
          <li>
            Please contact your local emergency services immediately (e.g.,
            911, 999, 112).
          </li>
          <li>
            BibleWay moderators, upon identifying credible threats of self-harm
            or harm to others, are authorized to contact emergency services
            and disclose relevant account information to protect life.
          </li>
          <li>
            The prayer request feature must not be used as a substitute for
            emergency or crisis support services.
          </li>
          <li>
            BibleWay may share crisis resource information (hotlines,
            counselling services) in response to distress signals in user
            content.
          </li>
        </UL>
      </section>

      {/* 20 */}
      <section>
        <H2>20. Entire Agreement &amp; Severability</H2>
        <P>
          These Terms and Conditions, together with the Privacy Policy and
          Community Standards, constitute the entire agreement between you and
          BibleWay Technologies regarding the App and supersede all prior or
          contemporaneous agreements, representations, or understandings.
        </P>
        <P>
          If any provision of these Terms is found to be invalid, illegal, or
          unenforceable, such provision shall be modified to the minimum
          extent necessary to make it enforceable, and the remaining
          provisions shall continue in full force and effect.
        </P>
      </section>

      {/* 21 */}
      <section>
        <H2>21. Contact Information</H2>
        <P>
          For questions, concerns, or requests relating to these Terms and
          Conditions, please contact:
        </P>
        <ul className="text-sm text-on-surface-variant space-y-1.5 mb-3">
          <li>
            <strong className="text-on-surface">General Support:</strong>{" "}
            support@bibleway.app
          </li>
          <li>
            <strong className="text-on-surface">Safety &amp; Abuse Reports:</strong>{" "}
            safety@bibleway.app
          </li>
          <li>
            <strong className="text-on-surface">Privacy &amp; Data Requests:</strong>{" "}
            privacy@bibleway.app
          </li>
          <li>
            <strong className="text-on-surface">Legal Notices:</strong>{" "}
            legal@bibleway.app
          </li>
          <li>
            <strong className="text-on-surface">Appeals:</strong>{" "}
            appeals@bibleway.app
          </li>
        </ul>
      </section>

      {/* Closing verse */}
      <div className="mt-12 pt-8 border-t border-outline-variant/15 text-center">
        <blockquote className="font-headline italic text-lg text-on-surface mb-2">
          &ldquo;Walk in wisdom toward outsiders, making the best use of the
          time.&rdquo;
        </blockquote>
        <p className="text-xs text-on-surface-variant">— Colossians 4:5</p>
        <p className="text-sm text-on-surface-variant mt-6">
          Thank you for being a part of the BibleWay community.
        </p>
      </div>
    </>
  );
}
