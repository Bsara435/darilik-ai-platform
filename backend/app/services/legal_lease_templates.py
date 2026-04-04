"""
Residential lease (Law 67-12) — structured templates in FR / EN / AR for Legal Advisor demo.
Based on the standard Moroccan habitation bail pattern; Article 5 wording corrected (tenant pays landlord).
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from app.models.legal import PostVisitForm
    from app.models.tenant import Tenant


def _deposit_dh(rent: float, deposit_label: str) -> int:
    months = 2 if "2" in (deposit_label or "") else 1
    return int(round(rent * months))


def _lease_end(move_in: date, duration_label: str) -> date:
    d = (duration_label or "").lower()
    if "6" in d and "month" in d or "6" in d and "mois" in d:
        return move_in + timedelta(days=183)
    if "2" in d and "year" in d or "2" in d and "ans" in d:
        return move_in + timedelta(days=730)
    if "flex" in d:
        return move_in + timedelta(days=365)
    return move_in + timedelta(days=365)


def _rent_words_fr(amount: int) -> str:
    known = {
        4400: "quatre mille quatre cents dirhams",
        4200: "quatre mille deux cents dirhams",
        5500: "cinq mille cinq cents dirhams",
    }
    return known.get(amount, f"{amount} dirhams (montant exprimé en chiffres)")


def _rent_words_en(amount: int) -> str:
    known = {4400: "four thousand four hundred Moroccan dirhams", 4200: "four thousand two hundred Moroccan dirhams"}
    return known.get(amount, f"{amount} Moroccan dirhams (amount in figures)")


def _rent_words_ar(amount: int) -> str:
    known = {4400: "أربعة آلاف وأربعمائة درهم", 4200: "أربعة آلاف ومائتا درهم"}
    return known.get(amount, f"{amount} درهم (بالأرقام)")


def _duration_fr(label: str) -> str:
    s = (label or "").lower()
    if "6 month" in s or s.startswith("6"):
        return "six (6) mois"
    if "2 year" in s or "2 ans" in s:
        return "deux (2) ans"
    if "flex" in s:
        return "une (1) année (bail à reconduction / flexibilité convenues entre les parties)"
    return "un (1) an"


def _duration_en(label: str) -> str:
    s = (label or "").lower()
    if "6 month" in s or s.startswith("6"):
        return "six (6) months"
    if "2 year" in s:
        return "two (2) years"
    if "flex" in s:
        return "one (1) year (renewable / flexible as agreed)"
    return "one (1) year"


def _duration_ar(label: str) -> str:
    s = (label or "").lower()
    if "6 month" in s or s.startswith("6"):
        return "ستة (6) أشهر"
    if "2 year" in s:
        return "سنتان (2)"
    if "flex" in s:
        return "سنة واحدة (قابلة للتجديد أو مرنة حسب الاتفاق)"
    return "سنة واحدة (1)"


def _payment_fr(method: str) -> str:
    m = (method or "").lower()
    if "trim" in m:
        return "trimestriellement"
    return "mensuellement"


def _payment_en_adv(method: str) -> str:
    m = (method or "").lower()
    if "trim" in m:
        return "on a quarterly basis, in advance"
    return "on a monthly basis, in advance"


def _special_block_fr(text: str | None) -> str:
    t = (text or "").strip()
    if not t:
        return ""
    return f"""

Article 17 — Conditions particulières convenues entre les parties
Les parties conviennent expressément de ce qui suit, qui fait partie intégrante du présent contrat :
{t}
"""


def _special_block_en(text: str | None) -> str:
    t = (text or "").strip()
    if not t:
        return ""
    return f"""

Article 17 — Special terms agreed between the parties
The parties expressly agree as follows, which forms an integral part of this lease:
{t}
"""


def _special_block_ar(text: str | None) -> str:
    t = (text or "").strip()
    if not t:
        return ""
    return f"""

المادة 17 — شروط خاصة اتفق عليها الطرفان
اتفق الطرفان صراحةً على ما يلي، وهي جزء لا يتجزأ من هذا العقد:
{t}
"""


def render_lease(form: "PostVisitForm", tenant: "Tenant", language: str) -> str:
    """language: ar | fr | en"""
    lang = (language or "ar").strip().lower()[:2]
    if lang not in ("ar", "fr", "en"):
        lang = "ar"

    rent = int(round(form.agreed_rent))
    dep = _deposit_dh(form.agreed_rent, form.agreed_deposit)
    end = _lease_end(form.agreed_move_in, form.agreed_duration)
    landlord_lat = settings.legal_landlord_name_latin
    landlord_ar = settings.legal_landlord_full_name
    prop = (form.property_address or "").strip() or "Adresse à compléter"
    tenant_addr = settings.demo_tenant_address_placeholder
    pay_fr = _payment_fr(form.agreed_payment_method)
    spec_fr = _special_block_fr(form.special_conditions)
    spec_en = _special_block_en(form.special_conditions)
    spec_ar = _special_block_ar(form.special_conditions)

    if lang == "fr":
        return f"""CONTRAT DE BAIL D'HABITATION
(Conforme aux dispositions de la loi n° 67-12)

ENTRE LES SOUSSIGNÉS

M./Mme {landlord_lat}, demeurant à {settings.legal_landlord_address}, propriétaire du logement ci-après désigné,
CI-APRÈS DÉNOMMÉ « LE BAILLEUR », d'une part,

Mme {tenant.full_name}, née le ………… à …………, demeurant à {tenant_addr},
CI-APRÈS DÉNOMMÉ « LE LOCATAIRE », d'autre part.

Il a été convenu et arrêté ce qui suit :

Le BAILLEUR donne en location au LOCATAIRE, qui l'accepte, le logement désigné ci-dessous. Le présent bail est régi par les dispositions de la loi 67-12 relative à l'organisation des rapports contractuels entre le bailleur et le locataire des locaux à usage d'habitation ou à usage professionnel.

Article 1 — Objet
Le BAILLEUR loue au LOCATAIRE les locaux et équipements à usage d'habitation ci-après désignés, que le LOCATAIRE accepte aux conditions suivantes.

Article 2 — Désignation des lieux loués
Adresse des locaux loués :
{prop}
Consistance : logement à usage d'habitation (appartement), tel que visité lors de la candidature et la visite post-sélection.

Article 3 — État des lieux
Un état des lieux sera établi contradictoirement par les parties lors de la remise des clés au LOCATAIRE et lors de leur restitution. À défaut, le LOCATAIRE est présumé avoir reçu les lieux en bon état et devra les rendre conformément à l'article 8 de la loi 67-12.

Article 4 — Durée du bail
Le présent contrat est consenti pour une durée de {_duration_fr(form.agreed_duration)}, à compter du {form.agreed_move_in} et se terminant le {end}, sous réserve de reconduction ou de renouvellement selon la loi.

Article 5 — Montant du loyer
Le LOCATAIRE s'engage à verser {pay_fr} au BAILLEUR, d'avance, la somme de {rent} DH à titre de loyer pour les locaux loués, pendant toute la durée du bail.
Le loyer est payable au domicile du BAILLEUR ou selon les coordonnées bancaires communiquées (mode : {form.agreed_payment_method}).
Le montant initial du loyer est fixé à la somme de {_rent_words_fr(rent)}.

Article 6 — Dépôt de garantie
Le dépôt de garantie versé par le LOCATAIRE s'élève à {dep} DH. Il ne peut excéder deux (2) mois de loyer (article 20 de la loi 67-12). Il est restitué dans un délai maximal d'un mois à compter de la restitution des lieux, sous déduction éventuelle des sommes dues.

Article 7 — Révision du loyer
L'augmentation du loyer est encadrée par la loi 67-12 (notamment après un délai de trois ans et selon les modalités légales).

Article 8 — Résiliation anticipée
Les cas de résiliation anticipée sont ceux prévus par la loi 67-12 (notamment article 56 — défaut de paiement, usage contraire à la destination, etc.), avec préavis lorsque la loi l'exige.

Article 9 — Obligations du BAILLEUR
Le BAILLEUR remet un logement décent, garantit la jouissance paisible, tient le logement en bon état d'usage, et délivre un reçu pour chaque paiement.

Article 10 — Obligations du LOCATAIRE
Le LOCATAIRE paie le loyer aux échéances, entretient les lieux, signale les dégradations, ne sous-loue pas sans accord écrit et ne réalise pas de travaux importants sans autorisation (article 17 de la loi 67-12).

Article 11 — Décès
Les suites du bail en cas de décès sont régies par la loi 67-12 (conjoint, descendants ou ascendants à charge, héritiers du bailleur, etc.).

Article 12 — Clause résolutoire
En cas d'inexécution des obligations essentielles ou de défaut de paiement du loyer, le bail pourra être résilié dans les conditions légales, après mise en demeure lorsque requis.

Article 13 — Clause pénale
Tout retard de paiement peut entraîner des conséquences prévues par la loi ou un intérêt de retard convenu dans la limite des textes en vigueur.

Article 14 — Élection de domicile
Les parties font élection de domicile aux adresses indiquées en tête de contrat.

Article 15 — Juridiction compétente
Les litiges relèvent des tribunaux marocains compétents.

Article 16 — Frais
Les frais de rédaction et d'enregistrement sont partagés comme convenu entre les parties ou selon les usages.
{spec_fr}
Fait à Casablanca, le ……………………
En deux (2) exemplaires originaux.

LE BAILLEUR                    LE LOCATAIRE
____________________           ____________________
"""

    if lang == "en":
        return f"""RESIDENTIAL LEASE AGREEMENT
(Governed by Moroccan Law 67-12)

BETWEEN

Mr./Ms. {landlord_lat}, residing at {settings.legal_landlord_address}, owner of the premises described below,
hereinafter the "LANDLORD", on the one hand,

Ms. {tenant.full_name}, born on ………… at …………, residing at {tenant_addr},
hereinafter the "TENANT", on the other hand.

The following has been agreed:

The LANDLORD lets to the TENANT, who accepts, the dwelling described below. This lease is governed by Law 67-12 on residential and certain professional premises.

Article 1 — Purpose
The LANDLORD lets to the TENANT the residential premises and fittings listed below, which the TENANT accepts on the terms set out herein.

Article 2 — Description
Address of the leased premises:
{prop}
Nature: residential unit (apartment) as viewed during the application and post-selection visit.

Article 3 — Condition report
A move-in/move-out condition report shall be drawn up jointly. If none is drawn up, the TENANT is presumed to have received the premises in good condition, as per Law 67-12.

Article 4 — Term
The lease runs for {_duration_en(form.agreed_duration)}, from {form.agreed_move_in} to {end}, subject to renewal as provided by law.

Article 5 — Rent
The TENANT shall pay the LANDLORD, {_payment_en_adv(form.agreed_payment_method)}, the sum of {rent} MAD as rent for the entire term.
Payment method agreed: {form.agreed_payment_method}.
Rent in words: {_rent_words_en(rent)}.

Article 6 — Security deposit
The security deposit is {dep} MAD, not exceeding two (2) months' rent (Art. 20, Law 67-12). Refund within one month of handover, less lawful deductions.

Article 7 — Rent review
Rent increases follow Law 67-12 (including the three-year rule and statutory caps).

Article 8 — Early termination
Grounds and notice follow Law 67-12 (including Art. 56 for serious breach or non-payment).

Article 9 — LANDLORD's duties
Decent housing, quiet enjoyment, maintenance, receipts for payments.

Article 10 — TENANT's duties
Pay rent on time, maintain the premises, report damage, no unlawful subletting, no major works without consent (Art. 17, Law 67-12).

Article 11 — Death
Continuance of the lease is governed by Law 67-12.

Article 12 — Resolutory clause
Serious breach or non-payment may lead to termination after formal notice where required by law.

Article 13 — Late payment
Late payment may attract lawful interest or penalties within legal limits.

Article 14 — Domicile
For service of notices, parties elect domicile at the addresses above.

Article 15 — Jurisdiction
Competent Moroccan courts.

Article 16 — Costs
Drafting and registration costs as agreed or per practice.
{spec_en}
Done at Casablanca, on ……………………
In two (2) original copies.

LANDLORD                       TENANT
____________________           ____________________
"""

    # Arabic (MSA legal style, same structure)
    return f"""عقـد كـراء سكني
(مُحرَّر وفق مقتضيات القانون رقم 67.12)

بين الطرفين

الطرف الأول : السيد(ة) {landlord_ar}، الساكن(ة) ب{settings.legal_landlord_address}، بصفته(ا) مالك(ة) للعين المكراة،
ويُدعى فيما يلي « المكري »،

والطرف الثاني : السيدة {tenant.full_name}، المولودة في ………… ب………………، الساكنة ب{tenant_addr}،
ويُدعى فيما يلي « المكتري ».

تم الاتفاق والتراضي على ما يلي :

يمكّن المكري المكتري، الذي يقبل، من السكنى في العين المحددة أدناه. يسري هذا العقد أحكام القانون 67.12 المتعلق بتنظيم العلاقة التعاقدية بين المكري والمكتري في المخصص للسكنى أو لبعض الاستعمالات المهنية.

المادة 1 — الموضوع
يكري المكري للمكتري المكان والتجهيزات المخصصة للسكنى، ويقبلها المكتري بالشروط التالية.

المادة 2 — تعيين المحل المكترى
عنوان المحل :
{prop}
الوصف : مسكن للسكنى (شقة) كما تمت معاينته عند الترشيح وبعد الزيارة.

المادة 3 — محضر حالة المحل
يُعدّ محضر حالة المحل بحضور الطرفين عند التسليم وعند الإرجاع. وفي حال عدم الإعداد، يُفترض أن المكتري استلم المحل في حالة جيدة، وفق المادة 8 من القانون 67.12.

المادة 4 — مدة الكراء
المدة : {_duration_ar(form.agreed_duration)}، ابتداء من {form.agreed_move_in} وتنتهي في {end}، مع إمكانية التجديد وفق القانون.

المادة 5 — الأجرة
يلتزم المكتري بأداء أجرة شهرية قدرها {rent} درهماً للمكري، مقدماً، طيلة مدة العقد، وفق الاتفاق (طريقة الدفع : {form.agreed_payment_method}).
الأجرة بالحروف : {_rent_words_ar(rent)}.

المادة 6 — الضمانة الكرائية
ضمانة كرائية قدرها {dep} درهماً، ولا تتجاوز شهرين من الأجرة (المادة 20 من القانون 67.12). تُسترد خلال أجل أقصاه شهر من تسليم المكان بعد خصم ما يثبت من مستحقات.

المادة 7 — مراجعة الأجرة
تخضع لأحكام القانون 67.12 (بما في ذلك أجل ثلاث سنوات والنسب القانونية).

المادة 8 — الفسخ المبكر
الحالات والآجال وفق القانون 67.12 (ومنها المادة 56 في شأن عدم الأداء أو إساءة الاستعمال).

المادة 9 — التزامات المكري
تسليم مسكن لائق، ضمان الهدوء، الصيانة اللازمة، وتسليم وصل عن كل أداء.

المادة 10 — التزامات المكتري
أداء الأجرة، المحافظة على المحل، الإخبار بالتلف، عدم التحتكار دون إذن، وعدم إجراء أشغال جسيمة دون موافقة (المادة 17 من القانون 67.12).

المادة 11 — الوفاة
استمرار العقد أو انتهاؤه يخضع للقانون 67.12.

المادة 12 — شرط فاسخ
عدم تنفيذ الالتزامات الجوهرية أو عدم أداء الأجرة قد يؤدي إلى الفسخ بعد الإنذار عندما يقتضي القانون ذلك.

المادة 13 — التأخير عن الأداء
للتأخير آثار قانونية أو اتفاقية ضمن حدود النصوص.

المادة 14 — الموطن
يختار الطرفان موطناً للتبليغ وفق العناوين أعلاه.

المادة 15 — القضاء
الجهات القضائية المختصة بالمغرب.

المادة 16 — المصاريف
مصاريف التحرير والتسجيل كما يتفق عليه الطرفان أو حسب العرف.
{spec_ar}
حرر بالدار البيضاء في ……………………
من أصلين (2).

إمضاء المكري: _______________        إمضاء المكتري: _______________
"""
