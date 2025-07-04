import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Modal } from 'react-bootstrap';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://teste.mapadacultura.com/api';

// CPF validation function (works on unformatted CPF)
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

// Format CPF as 000.000.000-00
function formatCPF(value) {
  value = value.replace(/\D/g, '').slice(0, 11);
  if (value.length > 9) {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  } else if (value.length > 6) {
    return value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (value.length > 3) {
    return value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  return value;
}

// CPF Exists Modal Component
function CPFExistsModal({ show, onHide, cpf, fullName, accountType, isSameType }) {
  const handleLogin = () => {
    window.location.href = '/agent/painel';
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Conta Já Existe</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="p-2">
          {isSameType ? (
            <>
              <p className="mb-2"><strong>CPF:</strong> {cpf}</p>
              <p className="mb-2"><strong>Tipo:</strong> {accountType}</p>
              <p className="mb-2">Conta já existe para este tipo</p>
            </>
          ) : (
            <>
              <p className="mb-2"><strong>CPF:</strong> {cpf} <strong> Nome:</strong> {fullName}</p>
              <p className="mb-2"><strong>Tipo:</strong> {accountType} . Faça login para solicitar outro tipo.</p>
            </>
          )}
        </div>
        <div className="d-flex gap-2 p-2 justify-content-between">
          <Button className="btn btn-secondary text-white" onClick={onHide}>Cancelar</Button>
          <Button className="text-dark border-0 px-3" onClick={handleLogin} style={{ background: '#A8EB7D' }}>Entrar</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

// Combined Registration Form Component
function RegistrationForm({ cpf, selectedType, existingProfile }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [pcd, setPcd] = useState(existingProfile?.pcd || 'Selecione');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Navigation functions
  const handleBack = () => {
    router.push('/agent?view=type', { scroll: false });
  };

  const handleClose = () => {
    router.push('/agent?view=type', { scroll: false });
  };

  // Pre-populate common fields if existingProfile is provided
  useEffect(() => {
    if (existingProfile) {
      const allFields = {
        // Common fields
        fullname: existingProfile.fullname || '',
        dob: existingProfile.dob ? new Date(existingProfile.dob).toISOString().split('T')[0] : '',
        rg: existingProfile.rg || '',
        socialname: existingProfile.socialname || '',
        gender: existingProfile.gender || 'Select',
        breed: existingProfile.breed || 'Select',
        lgbtq: existingProfile.lgbtq || 'Select',
        education: existingProfile.education || 'Select',
        income: existingProfile.income || 'Select',
        mainActivity: existingProfile.mainActivity || 'Select',
        otherActivity: existingProfile.otherActivity || 'Select',
        traditionalCommunities: existingProfile.traditionalCommunities || 'Select',
        pcd: existingProfile.pcd || 'No',
        withoutPcd: existingProfile.withoutPcd || '',
        city: existingProfile.city || 'Select',
        district: existingProfile.district || 'Select',
        street: existingProfile.street || '',
        telephone: existingProfile.telephone || '',
        responsible: existingProfile.responsible || '',
        email: existingProfile.email || '',
        socialProgramBeneficiary: existingProfile.socialProgramBeneficiary || 'Select',
        socialProgramName: existingProfile.socialProgramName || '',

        // Business-specific fields
        cnpjType: existingProfile.businessData?.cnpjType || 'Select',
        razaoSocial: existingProfile.businessData?.razaoSocial || '',
        nomeFantasia: existingProfile.businessData?.nomeFantasia || '',
        cnpj: existingProfile.businessData?.cnpj || '',

        // Collective-specific fields
        collectiveName: existingProfile.collectiveData?.collectiveName || '',
        dayCreated: existingProfile.collectiveData?.dayCreated || '',
        monthCreated: existingProfile.collectiveData?.monthCreated || 'Select',
        yearCreated: existingProfile.collectiveData?.yearCreated || '',
        participants: existingProfile.collectiveData?.participants || ''
      };

      // Update form data with all fields
      setFormData(prev => ({
        ...prev,
        ...allFields
      }));

      // Update PCD state
      if (existingProfile.pcd) {
        setPcd(existingProfile.pcd);
      }
    }
  }, [existingProfile]);

  // Get header text based on type
  const getHeaderText = () => {
    switch (selectedType) {
      case 'personal':
        return 'Forneça mais informações sobre você (PESSOA FÍSICA)';
      case 'business':
        return 'Forneça mais informações sobre você (PESSOA JURÍDICA)';
      case 'collective':
        return 'Forneça mais informações sobre você (GRUPO COLETIVO)';
      default:
        return 'Forneça mais informações sobre você';
    }
  };

  // Handle form field changes
  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Validate required fields based on type
  const validateForm = () => {
    const newErrors = {};

    // Common required fields for all types
    const commonRequiredFields = [
      'dob', 'fullname', 'rg', 'gender', 'breed', 'lgbtq', 'education',
      'income', 'mainActivity', 'traditionalCommunities', 'city',
      'telephone', 'responsible', 'email', 'password'
    ];

    // Check common required fields
    commonRequiredFields.forEach(field => {
      if (!formData[field] || formData[field] === 'Select' || formData[field] === 'Selecione' || formData[field] === '') {
        newErrors[field] = 'Este campo é obrigatório';
      }
    });

    // PCD is now optional, so we don't validate it
    // Only validate if terms are accepted
    if (!accepted) {
      newErrors.acceptTerms = 'Você deve aceitar os termos e condições';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Prepare data for backend
        const profileData = {
          cpf,
          selectedType,
          ...formData,
          pcd: pcd === 'Selecione' ? null : pcd, // Set to null if not selected
          acceptedTerms: accepted
        };

        // Submit to backend
        const response = await fetch(`${API_BASE_URL}/agent/profile`, {
          // const response = await fetch('https://mapacultural.gestorcultural.com.br/api/agent/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'dummy-token-for-testing'
          },
          body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (response.ok) {
          console.log('Profile created/updated successfully:', result);
          alert('Account created successfully!');
          window.location.href = '/agent/painel';
        } else {
          console.error('Error creating profile:', result);
          alert('Error creating account: ' + result.error);
        }
      } catch (error) {
        console.error('Network error:', error);
        alert('Network error. Please try again.');
      }
    } else {
      console.log('Form validation failed:', errors);
    }
  };

  return (
    <>
      {/* Header with navigation */}
      <div className="container py-2 border-0" style={{ background: '#fff' }}>
        <div className="d-flex align-items-center justify-content-between">
          {/* Left: Logo and Text */}
          <div className="d-flex gap-5 align-items-center">
          <Image src="/images/MadminLogo.jpg" alt="Gestor Cultural Logo" width={160} height={50} style={{ marginRight: 8 }} />
            <button   onClick={handleBack}
          className="btn btn-link text-decoration-none"
          style={{ color: '#1A2530', fontSize: '26px', border: '0.1px solid rgb(206, 206, 206)',borderRadius: '50%', background: 'rgba(26, 37, 48, 0.1)', height: '50px', width: '50px' }}
        >
          ← 
        </button>
        </div>
          {/* Right: Icons */}
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ background: '#D9DED9', width: 48, height: 48 }}>
              {/* Calendar Icon (placeholder SVG) */}
              <svg width="24" height="24" fill="none" stroke="#1A2530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </span>
            <span 
              className="d-flex align-items-center justify-content-center" 
              style={{ width: 32, height: 32, cursor: 'pointer' }}
              onClick={handleClose}
            >
              {/* Close Icon (X, placeholder SVG) */}
              <svg width="28" height="28" fill="none" stroke="#1A2530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <Container className="py-5 px-2 px-lg-5" style={{ maxWidth: 800 }}>
        <h3 className="fw-bold text-center py-4" style={{ fontSize: '20px' }}>
          {getHeaderText()}
        </h3>
        <hr />
        <Form onSubmit={handleSubmit}>
          <h4 className="fw-bold mb-3">Dados Pessoais</h4>
          <Form.Group className="mb-3" controlId="cpf">
            <Form.Label>CPF *</Form.Label>
            <Form.Control className="border-dark-gray" type="text" value={cpf} readOnly />
          </Form.Group>
          <Form.Group className="mb-3" controlId="fullname">
            <Form.Label>Nome completo *</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="text"
              value={formData.fullname || ''}
              isInvalid={!!errors.fullname}
              onChange={(e) => handleFieldChange('fullname', e.target.value)}
            />
            <Form.Control.Feedback type="invalid">{errors.fullname}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="socialname">
            <Form.Label>Nome social</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="text"
              value={formData.socialname || ''}
              onChange={(e) => handleFieldChange('socialname', e.target.value)}
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="gender">
                <Form.Label>Gênero *</Form.Label>
                <Form.Select
                  className="border-dark-gray"
                  value={formData.gender || 'Selecione'}
                  isInvalid={!!errors.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                >
                  <option>Selecione</option>
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Outro</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.gender}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="breed">
                <Form.Label>Raça *</Form.Label>
                <Form.Select
                  className="border-dark-gray"
                  value={formData.breed || 'Selecione'}
                  isInvalid={!!errors.breed}
                  onChange={(e) => handleFieldChange('breed', e.target.value)}
                >
                  <option>Selecione</option>
                  <option>Raça 1</option>
                  <option>Raça 2</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.breed}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="lgbtq">
            <Form.Label>Você é LGBTQIAPN+? *</Form.Label>
            <Form.Select
              className="border-dark-gray"
              value={formData.lgbtq || 'Selecione'}
              isInvalid={!!errors.lgbtq}
              onChange={(e) => handleFieldChange('lgbtq', e.target.value)}
            >
              <option>Selecione</option>
              <option>Sim</option>
              <option>Não</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.lgbtq}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="dob">
            <Form.Label>Data de nascimento *</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="date"
              value={formData.dob || ''}
              isInvalid={!!errors.dob}
              onChange={(e) => handleFieldChange('dob', e.target.value)}
            />
            <Form.Control.Feedback type="invalid">{errors.dob}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="rg">
            <Form.Label>RG *</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="text"
              value={formData.rg || ''}
              isInvalid={!!errors.rg}
              onChange={(e) => handleFieldChange('rg', e.target.value)}
            />
            <Form.Control.Feedback type="invalid">{errors.rg}</Form.Control.Feedback>
          </Form.Group>
          <h4 className="fw-bold mb-3">Informações de Acessibilidade</h4>
          <Form.Group className="mb-3" controlId="pcd">
            <Form.Label>Você tem alguma deficiência de PCD? *</Form.Label>
            <Form.Select
              className="border-dark-gray"
              value={pcd}
              isInvalid={!!errors.pcd}
              onChange={(e) => {
                setPcd(e.target.value);
                handleFieldChange('pcd', e.target.value);
              }}
            >
              <option value="Selecione">Selecione</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.pcd}</Form.Control.Feedback>
          </Form.Group>
          {pcd === 'Sim' && (
            <Form.Group className="mb-3" controlId="withoutPcd">
              <Form.Label>No caso sem PCD, qual?</Form.Label>
              <Form.Control
                className="border-dark-gray"
                type="text"
                value={formData.withoutPcd || ''}
                onChange={(e) => handleFieldChange('withoutPcd', e.target.value)}
              />
            </Form.Group>
          )}
          <h4 className="fw-bold mb-3">Informações Socioeconômicas e Educacionais</h4>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="education">
                <Form.Label>Educação *</Form.Label>
                <Form.Select
                  className="border-dark-gray"
                  value={formData.education || 'Selecione'}
                  isInvalid={!!errors.education}
                  onChange={(e) => handleFieldChange('education', e.target.value)}
                >
                  <option>Selecione</option>
                  <option>Ensino Médio</option>
                  <option>Graduação</option>
                  <option>Mestrado</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.education}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="income">
                <Form.Label>Renda individual *</Form.Label>
                <Form.Select
                  className="border-dark-gray"
                  value={formData.income || 'Selecione'}
                  isInvalid={!!errors.income}
                  onChange={(e) => handleFieldChange('income', e.target.value)}
                >
                  <option>Selecione</option>
                  <option>Abaixo de R$ 20.000</option>
                  <option>R$ 20.000 - R$ 50.000</option>
                  <option>Acima de R$ 50.000</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.income}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="socialProgramBeneficiary">
            <Form.Label>Beneficiário de algum programa social?</Form.Label>
            <Form.Select
              className="border-dark-gray"
              value={formData.socialProgramBeneficiary || 'Selecione'}
              onChange={(e) => handleFieldChange('socialProgramBeneficiary', e.target.value)}
            >
              <option>Selecione</option>
              <option>Sim</option>
              <option>Não</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="socialProgramName">
            <Form.Label>Nome do programa social</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="text"
              value={formData.socialProgramName || ''}
              onChange={(e) => handleFieldChange('socialProgramName', e.target.value)}
            />
          </Form.Group>
          <h4 className="fw-bold mb-3">Informações Profissionais</h4>
          <Form.Group className="mb-3" controlId="mainActivity">
            <Form.Label>Principal área de atuação *</Form.Label>
            <Form.Select
              className="border-dark-gray"
              value={formData.mainActivity || 'Selecione'}
              isInvalid={!!errors.mainActivity}
              onChange={(e) => handleFieldChange('mainActivity', e.target.value)}
            >
              <option>Selecione</option>
              <option>Atividade 1</option>
              <option>Atividade 2</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.mainActivity}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="otherActivity">
            <Form.Label>Outras áreas de atuação</Form.Label>
            <Form.Select
              className="border-dark-gray"
              value={formData.otherActivity || 'Selecione'}
              onChange={(e) => handleFieldChange('otherActivity', e.target.value)}
            >
              <option>Selecione</option>
              <option>Atividade 1</option>
              <option>Atividade 2</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="traditionalCommunities">
            <Form.Label>Você pertence a comunidades tradicionais?</Form.Label>
            <Form.Select
              className="border-dark-gray"
              value={formData.traditionalCommunities || 'Selecione'}
              isInvalid={!!errors.traditionalCommunities}
              onChange={(e) => handleFieldChange('traditionalCommunities', e.target.value)}
            >
              <option>Selecione</option>
              <option>Comunidade 1</option>
              <option>Comunidade 2</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.traditionalCommunities}</Form.Control.Feedback>
          </Form.Group>
          <h4 className="fw-bold mb-3">Endereço</h4>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="city">
                <Form.Label>Cidade *</Form.Label>
                <Form.Select
                  className="border-dark-gray"
                  value={formData.city || 'Selecione'}
                  isInvalid={!!errors.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                >
                  <option>Selecione</option>
                  <option>Cidade 1</option>
                  <option>Cidade 2</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="district">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  className="border-dark-gray"
                  value={formData.district || 'Selecione'}
                  onChange={(e) => handleFieldChange('district', e.target.value)}
                >
                  <option>Selecione</option>
                  <option>Estado 1</option>
                  <option>Estado 2</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="street">
            <Form.Label>Nome e número da rua</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="text"
              value={formData.street || ''}
              onChange={(e) => handleFieldChange('street', e.target.value)}
            />
          </Form.Group>
          {(selectedType === 'business' || selectedType === 'collective') && (
            <>
              <h4 className="py-4 text-center" style={{background:'#f7f8f9'}}>Insira os dados adicionais da organização</h4>
              {selectedType === 'business' && (
                <>
                  <Form.Group className="mb-3" controlId="cnpjType">
                    <Form.Label>Tipo de CNPJ</Form.Label>
                    <Form.Select
                      className="border-dark-gray"
                      value={formData.cnpjType || 'Selecione'}
                      isInvalid={!!errors.cnpjType}
                      onChange={(e) => handleFieldChange('cnpjType', e.target.value)}
                    >
                      <option>Selecione</option>
                      <option>MEI</option>
                      <option>ME</option>
                      <option>EIRELI</option>
                      <option>Sociedade Empresária Limitada</option>
                      <option>Sociedade Anônima</option>
                      <option>Outros</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.cnpjType}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="razaoSocial">
                    <Form.Label>Razão Social</Form.Label>
                    <Form.Text className="text-muted d-block mb-2" style={{ fontSize: '12px', color: '#666' }}>
                      O nome deve corresponder ao registrado oficialmente.
                    </Form.Text>
                    <Form.Control
                      className="border-dark-gray"
                      type="text"
                      value={formData.razaoSocial || ''}
                      isInvalid={!!errors.razaoSocial}
                      onChange={(e) => handleFieldChange('razaoSocial', e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">{errors.razaoSocial}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="nomeFantasia">
                    <Form.Label>Nome fantasia da empresa (Opcional)</Form.Label>
                    <Form.Control
                      className="border-dark-gray"
                      type="text"
                      value={formData.nomeFantasia || ''}
                      onChange={(e) => handleFieldChange('nomeFantasia', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="cnpj">
                    <Form.Label>Número do CNPJ</Form.Label>
                    <Form.Control
                      className="border-dark-gray"
                      type="text"
                      value={formData.cnpj || ''}
                      isInvalid={!!errors.cnpj}
                      onChange={(e) => handleFieldChange('cnpj', e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">{errors.cnpj}</Form.Control.Feedback>
                  </Form.Group>
                </>
              )}
              {selectedType === 'collective' && (
                <>
                  <Form.Group className="mb-3" controlId="collectiveName">
                    <Form.Label>Nome do coletivo *</Form.Label>
                    <Form.Control
                      className="border-dark-gray"
                      type="text"
                      value={formData.collectiveName || ''}
                      isInvalid={!!errors.collectiveName}
                      onChange={(e) => handleFieldChange('collectiveName', e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">{errors.collectiveName}</Form.Control.Feedback>
                  </Form.Group>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3" controlId="dayCreated">
                        <Form.Label>Dia</Form.Label>
                        <Form.Control
                          className="border-dark-gray"
                          type="text"
                          value={formData.dayCreated || ''}
                          onChange={(e) => handleFieldChange('dayCreated', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3" controlId="monthCreated">
                        <Form.Label>Mês</Form.Label>
                        <Form.Select
                          className="border-dark-gray"
                          value={formData.monthCreated || 'Selecione'}
                          onChange={(e) => handleFieldChange('monthCreated', e.target.value)}
                        >
                          <option>Janeiro</option>
                          <option>Fevereiro</option>
                          <option>Março</option>
                          <option>Abril</option>
                          <option>Maio</option>
                          <option>Junho</option>
                          <option>Julho</option>
                          <option>Agosto</option>
                          <option>Setembro</option>
                          <option>Outubro</option>
                          <option>Novembro</option>
                          <option>Dezembro</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3" controlId="yearCreated">
                        <Form.Label>Ano</Form.Label>
                        <Form.Control
                          className="border-dark-gray"
                          type="text"
                          value={formData.yearCreated || ''}
                          onChange={(e) => handleFieldChange('yearCreated', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3" controlId="participants">
                    <Form.Label>Quantas pessoas participam do coletivo *</Form.Label>
                    <Form.Control
                      className="border-dark-gray"
                      type="text"
                      value={formData.participants || ''}
                      isInvalid={!!errors.participants}
                      onChange={(e) => handleFieldChange('participants', e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">{errors.participants}</Form.Control.Feedback>
                  </Form.Group>
                </>
              )}
            </>
          )}
          <h4 className="fw-bold mb-3">Contato</h4>
          <Form.Group className="mb-3" controlId="telephone">
            <Form.Label>Telefone</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="text"
              value={formData.telephone || ''}
              isInvalid={!!errors.telephone}
              onChange={(e) => handleFieldChange('telephone', e.target.value)}
            />
            <Form.Control.Feedback type="invalid">{errors.telephone}</Form.Control.Feedback>
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>E-mail para login *</Form.Label>
                <Form.Control
                  className="border-dark-gray"
                  type="email"
                  value={formData.email || ''}
                  isInvalid={!!errors.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Senha *</Form.Label>
                <Form.Control
                  className="border-dark-gray"
                  type="password"
                  isInvalid={!!errors.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                />
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <h4 className="fw-bold mb-3">Responsável pela Inscrição</h4>
          <Form.Group className="mb-3" controlId="responsible">
            <Form.Label>Nome da pessoa responsável pelo registro (se não for a própria pessoa)</Form.Label>
            <Form.Control
              className="border-dark-gray"
              type="text"
              value={formData.responsible || ''}
              isInvalid={!!errors.responsible}
              onChange={(e) => handleFieldChange('responsible', e.target.value)}
            />
            <Form.Control.Feedback type="invalid">{errors.responsible}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-4" controlId="acceptTerms">
            <Form.Check
              type="checkbox"
              label="Aceito os termos de uso e a política de privacidade:"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              isInvalid={!!errors.acceptTerms}
            />
            {errors.acceptTerms && (
              <div className="invalid-feedback d-block">{errors.acceptTerms}</div>
            )}
          </Form.Group>
          <Button
            type="submit"
            className="w-100 fw-bold"
            style={{
              background: '#A8EB7D',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1rem',
              padding: '18px 0',
              color: '#222',
            }}
          >
            Criar conta
          </Button>
        </Form>
      </Container>
    </>
  );
}

export default function CPF({ selectedType, onContinue }) {
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [validatedCpf, setValidatedCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfileData, setExistingProfileData] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    cpf: '',
    fullName: '',
    accountType: '',
    isSameType: false
  });

  // Navigation functions
  const handleBack = () => {
    router.push('/agent?view=type', { scroll: false });
  };

  const handleClose = () => {
    router.push('/agent?view=type', { scroll: false });
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCpf(formatCPF(raw));
    if (error) setError('');
  };

  // Function to check if CPF exists in agent profiles
  const checkCPFExists = async (cpfToCheck) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/profile/${cpfToCheck}`, {
        // const response = await fetch(`https://mapacultural.gestorcultural.com.br/api/agent/profile/${cpfToCheck}`, {
        method: 'GET',
        headers: {
          'Authorization': 'dummy-token-for-testing'
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        console.log('Fetched profile data:', profileData); // Debugging line
        return profileData;
      } else if (response.status === 404) {
        return null;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error checking CPF');
      }
    } catch (error) {
      console.error('Error checking CPF:', error);
      throw error;
    }
  };

  // Function to get completed account types from profile
  const getCompletedTypes = (profile) => {
    const completedTypes = [];

    if (profile.typeStatus?.personal?.isComplete) {
      completedTypes.push('personal');
    }
    if (profile.typeStatus?.business?.isComplete) {
      completedTypes.push('business');
    }
    if (profile.typeStatus?.collective?.isComplete) {
      completedTypes.push('collective');
    }

    return completedTypes;
  };

  // Function to get type display name
  const getTypeDisplayName = (type) => {
    switch (type) {
      case 'personal':
        return 'PESSOA FÍSICA';
      case 'business':
        return 'PESSOA JURÍDICA';
      case 'collective':
        return 'GRUPO COLETIVO';
      default:
        return type;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawCpf = cpf.replace(/\D/g, '');

    if (!validateCPF(rawCpf)) {
      setError('Please enter a valid CPF number.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if CPF already exists
      const existingProfile = await checkCPFExists(formatCPF(rawCpf));

      if (existingProfile) {
        // CPF exists, get completed types
        const completedTypes = getCompletedTypes(existingProfile);
        const fullName = existingProfile.fullname || 'Unknown';

        // Check if the selected type is already complete
        if (completedTypes.includes(selectedType)) {
          // Same type already exists - show modal and prevent registration
          const typeDisplayName = getTypeDisplayName(selectedType);
          setModalData({
            cpf: formatCPF(rawCpf),
            fullName: fullName,
            accountType: typeDisplayName,
            isSameType: true
          });
          setShowModal(true);
        } else {
          // Different type exists - allow registration and pre-populate data
          setValidatedCpf(formatCPF(rawCpf));
          setExistingProfileData(existingProfile);
          setShowForm(true);
        }
      } else {
        // CPF doesn't exist, show registration form
        setValidatedCpf(formatCPF(rawCpf));
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error checking CPF existence:', error);
      setError('Error checking CPF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show registration form after CPF validation
  if (showForm) {
    return <RegistrationForm 
      cpf={validatedCpf} 
      selectedType={selectedType} 
      existingProfile={existingProfileData} 
    />;
  }

  // Show CPF input form
  return (
    <>
  
  <div className="container py-2 border-0" style={{ background: '#fff' }}>
      <div className="d-flex align-items-center justify-content-between">
        {/* Left: Logo and Text */}
        <div className="d-flex gap-5 align-items-center">
          <Image src="/images/MadminLogo.jpg" alt="Gestor Cultural Logo" width={160} height={50} style={{ marginRight: 8 }} />
            <button   onClick={handleBack}
          className="btn btn-link text-decoration-none"
          style={{ color: '#1A2530', fontSize: '26px', border: '0.1px solid rgb(206, 206, 206)',borderRadius: '50%', background: 'rgba(26, 37, 48, 0.1)', height: '50px', width: '50px' }}
        >
          ← 
        </button>
        </div>
      
        {/* Right: Icons */}
        <div className="d-flex align-items-center gap-3">
          <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ background: '#D9DED9', width: 48, height: 48 }}>
            {/* Calendar Icon (placeholder SVG) */}
            <svg width="24" height="24" fill="none" stroke="#1A2530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </span>
          <span 
            className="d-flex align-items-center justify-content-center" 
            style={{ width: 32, height: 32, cursor: 'pointer' }}
            onClick={handleClose}
          >
            {/* Close Icon (X, placeholder SVG) */}
            <svg width="28" height="28" fill="none" stroke="#1A2530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        </div>
      </div>
    </div>

      <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh', maxWidth: 700 }}>
        <div className="position-relative w-100">
          <h2 className="fw-bold text-center mb-4" style={{ fontSize: '1.6rem' }}>
            Digite seu número de CPF
          </h2>
          <hr />
        </div>
        <Form className="w-100" style={{ maxWidth: 600 }} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="cpfInput">
            <Form.Label className="fw-bold" style={{ color: '#2c3550' }}>
              CPF *
            </Form.Label>
            <Form.Control
              type="text"
              value={cpf}
              className="p-3 rounded-4"
              onChange={handleChange}
              style={{
                border: '2px solid #bbb',
              }}
              isInvalid={!!error}
              maxLength={14} // 000.000.000-00
              inputMode="numeric"
              autoComplete="off"
              disabled={isLoading}
            />
            {error && (
              <Form.Control.Feedback type="invalid" className="d-block">
                {error}
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Button
            type="submit"
            className="w-100 btn border-0 fw-bold p-3 rounded-pill fs-5 text-dark"
            style={{
              background: isLoading ? '#ccc' : '#A8EB7D',
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Continuar'}
          </Button>
        </Form>
      </Container>

      {/* CPF Exists Modal */}
      <CPFExistsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        cpf={modalData.cpf}
        fullName={modalData.fullName}
        accountType={modalData.accountType}
        isSameType={modalData.isSameType}
      />
    </>
  );
} 