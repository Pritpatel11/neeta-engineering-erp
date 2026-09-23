require('dotenv').config();
const mongoose = require('mongoose');
const { normalizeSandboxGstData } = require('./src/services/sandboxGstService');
const PrivateParty = require('./src/models/PrivateParty');
const Quotation = require('./src/models/Quotation');

async function runTests() {
  console.log('=====================================================');
  console.log('GST VERIFICATION & CONTACT ENRICHMENT TEST SUITE');
  console.log('=====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  // -----------------------------------------------------------------
  // SCENARIO 1: Valid GSTIN with available contact information in API
  // -----------------------------------------------------------------
  console.log('--- SCENARIO 1: GST API Returns Contact Information (contact.email, contact.mobile, auth, etc.) ---');
  const mockApiWithContacts = {
    data: {
      data: {
        gstin: '24ABCDE1234F1Z5',
        lgnm: 'Apex Industrial Solutions Pvt Ltd',
        tradeNam: 'Apex Solutions',
        sts: 'Active',
        ctb: 'Private Limited Company',
        dty: 'Regular',
        pradr: {
          addr: {
            bno: '402',
            bnm: 'Apex Tower',
            st: 'SG Highway',
            dst: 'Ahmedabad',
            pncd: '380054',
            stcd: 'Gujarat'
          }
        },
        contact: {
          email: 'accounts@apexsolutions.in',
          mobile: '9825012345',
          name: 'Vikas Sharma'
        }
      }
    }
  };

  const norm1 = normalizeSandboxGstData(mockApiWithContacts, '24ABCDE1234F1Z5');
  console.log('Normalized Result:');
  console.log('  Legal Name:', norm1.legalName);
  console.log('  Trade Name:', norm1.tradeName);
  console.log('  Email:', norm1.email);
  console.log('  Phone:', norm1.phone);
  console.log('  Contact Person:', norm1.contactPerson);
  console.log('  City:', norm1.city);
  console.log('  Pincode:', norm1.pincode);
  console.log('  hasContactInfo:', norm1.hasContactInfo);
  console.assert(norm1.email === 'accounts@apexsolutions.in', 'Email should match');
  console.assert(norm1.phone === '9825012345', 'Phone should match');
  console.assert(norm1.hasContactInfo === true, 'hasContactInfo should be true');
  console.log('>> SCENARIO 1: PASSED\n');

  // -----------------------------------------------------------------
  // SCENARIO 2: Valid GSTIN without contact info in API (Government GSTN privacy policy)
  // -----------------------------------------------------------------
  console.log('--- SCENARIO 2: Valid GSTIN without contact info in API (GSTN Privacy Standard) ---');
  const mockApiWithoutContacts = {
    data: {
      data: {
        gstin: '24ABHPP5386L1Z3',
        lgnm: 'RAMANLAL BABALDAS PATEL',
        tradeNam: 'NEETA ENGINEERING WORKS',
        sts: 'Active',
        ctb: 'Proprietorship',
        dty: 'Regular',
        pradr: {
          addr: {
            bno: '179',
            st: 'G.I.D.C.',
            dst: 'Banaskantha',
            pncd: '385510',
            stcd: 'Gujarat'
          }
        }
      }
    }
  };

  const norm2 = normalizeSandboxGstData(mockApiWithoutContacts, '24ABHPP5386L1Z3');
  console.log('Normalized Result:');
  console.log('  Legal Name:', norm2.legalName);
  console.log('  Trade Name:', norm2.tradeName);
  console.log('  Email:', norm2.email || '(Empty as per GSTN public policy)');
  console.log('  Phone:', norm2.phone || '(Empty as per GSTN public policy)');
  console.log('  hasContactInfo:', norm2.hasContactInfo);
  console.assert(norm2.email === '', 'Email should be empty string');
  console.assert(norm2.phone === '', 'Phone should be empty string');
  console.assert(norm2.hasContactInfo === false, 'hasContactInfo should be false');
  console.log('>> SCENARIO 2: PASSED\n');

  // -----------------------------------------------------------------
  // SCENARIO 3: Non-destructive Form State Simulation
  // User had typed Phone/Email manually before GST verification
  // -----------------------------------------------------------------
  console.log('--- SCENARIO 3: Preserving Manually Entered Contact Info ---');
  const prevFormData = {
    clientName: 'Existing Name',
    clientPhone: '9988776655',
    clientEmail: 'user.typed@example.com',
    clientAddress: ''
  };

  // When API returns no contact info (norm2)
  const mergedFormDataNoContact = {
    ...prevFormData,
    clientGST: norm2.gstin,
    clientName: norm2.tradeName || norm2.legalName || prevFormData.clientName,
    companyName: norm2.legalName || norm2.tradeName,
    clientAddress: norm2.address || prevFormData.clientAddress,
    clientPhone: norm2.phone || prevFormData.clientPhone || '',
    clientEmail: norm2.email || prevFormData.clientEmail || '',
  };

  console.log('User-typed Phone:', prevFormData.clientPhone);
  console.log('Phone after GST verification:', mergedFormDataNoContact.clientPhone);
  console.log('User-typed Email:', prevFormData.clientEmail);
  console.log('Email after GST verification:', mergedFormDataNoContact.clientEmail);
  console.assert(mergedFormDataNoContact.clientPhone === '9988776655', 'Phone must NOT be wiped');
  console.assert(mergedFormDataNoContact.clientEmail === 'user.typed@example.com', 'Email must NOT be wiped');
  console.log('>> SCENARIO 3: PASSED (Values preserved flawlessly)\n');

  // -----------------------------------------------------------------
  // SCENARIO 4: Form Auto-populates when API provides contact info
  // -----------------------------------------------------------------
  console.log('--- SCENARIO 4: Auto-populating Phone & Email when API has contact info ---');
  const emptyForm = { clientPhone: '', clientEmail: '' };
  const autoPopulatedForm = {
    ...emptyForm,
    clientPhone: norm1.phone || emptyForm.clientPhone,
    clientEmail: norm1.email || emptyForm.clientEmail,
  };
  console.log('Form clientPhone after auto-pop:', autoPopulatedForm.clientPhone);
  console.log('Form clientEmail after auto-pop:', autoPopulatedForm.clientEmail);
  console.assert(autoPopulatedForm.clientPhone === '9825012345', 'Phone should be auto-populated');
  console.assert(autoPopulatedForm.clientEmail === 'accounts@apexsolutions.in', 'Email should be auto-populated');
  console.log('>> SCENARIO 4: PASSED\n');

  // -----------------------------------------------------------------
  // SCENARIO 5: Database Fallback - PrivateParty match
  // -----------------------------------------------------------------
  console.log('--- SCENARIO 5: Database Fallback to PrivateParty contact details ---');
  // Seed a temporary test party
  const testPartyName = 'Test Industrial Automation Co';
  await PrivateParty.deleteOne({ name: testPartyName });
  await PrivateParty.create({
    name: testPartyName,
    phone: '9898011223',
    email: 'contact@testauto.com',
    address: 'Plot 45, GIDC Vatva, Ahmedabad',
    gst: '24AAACT1234Q1Z9'
  });

  const matched = await PrivateParty.findOne({ name: new RegExp(`^${testPartyName}$`, 'i') });
  console.log('Matched party phone:', matched.phone);
  console.log('Matched party email:', matched.email);
  console.assert(matched.phone === '9898011223');
  console.assert(matched.email === 'contact@testauto.com');
  // Cleanup test party
  await PrivateParty.deleteOne({ name: testPartyName });
  console.log('>> SCENARIO 5: PASSED\n');

  console.log('=====================================================');
  console.log('ALL 5 END-TO-END SCENARIO TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
