import { useEffect } from 'react'
import { Box, Heading, Stack } from '@chakra-ui/react'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import instance from '@/lib/axiosInstance'
import { type OwnerInfo, ownerInfoSchema } from '@/lib/validations/registry'
import { CustomButton } from '@/components/ui'
import { FormInput, FormSelect } from '@/components/form'
import { Countries, BusinessOwnerIDType } from 'shared-lib'
import GridShell from './GridShell'

const COUNTRIES = Object.entries(Countries).map(([, label]) => ({
  value: label,
  label,
}))

const ID_TYPES = Object.entries(BusinessOwnerIDType).map(([, label]) => ({
  value: label,
  label,
}))

interface OwnerInfoFormProps {
  setActiveStep: React.Dispatch<React.SetStateAction<number>>
}

const OwnerInfoForm = ({ setActiveStep }: OwnerInfoFormProps) => {
  const {
    register,
    formState: { errors },
    setFocus,
    handleSubmit,
  } = useForm<OwnerInfo>({
    resolver: zodResolver(ownerInfoSchema),
    defaultValues: {
      email: null,
    },
  })

  const onSubmit = async (values: OwnerInfo) => {
    const merchantId = sessionStorage.getItem('merchantId')
    if (merchantId == null) {
      alert('Merchant ID not found. Go back to the previous page and try again')
      return
    }

    try {
      const response = await instance.post<{ data: { id: number }; message: string }>(
        `/merchants/${merchantId}/business-owners`,
        values,
        {
          headers: {
            Authorization: `Bearer test_1_dummy_auth_token`,
          },
        }
      )

      if (response.data.data?.id) {
        alert(response.data.message)
        setActiveStep(activeStep => activeStep + 1)
      }
    } catch (error) {
      if (isAxiosError(error)) {
        console.log(error)
        alert(
          'Error: ' + error.response?.data?.error ||
            'Something went wrong! Please check your data and try again.'
        )
      }
    }
  }

  // focus on first input that has error after validation
  useEffect(() => {
    const firstError = Object.keys(errors)[0] as keyof OwnerInfo

    if (firstError) {
      setFocus(firstError)
    }
  }, [errors, setFocus])

  return (
    <Stack as='form' onSubmit={handleSubmit(onSubmit)} pt='20' noValidate>
      <GridShell justifyItems='center'>
        <FormInput
          isRequired
          name='name'
          register={register}
          errors={errors}
          label='Name'
          placeholder='Name'
        />

        <FormSelect
          isRequired
          name='identificaton_type'
          register={register}
          errors={errors}
          label='ID Type'
          placeholder='Chosse National ID Type'
          options={ID_TYPES}
          errorMsg='Please select a ID Type'
        />
        <FormInput
          isRequired
          name='identification_number'
          register={register}
          errors={errors}
          label='Identification Number'
          placeholder='Identification Number'
        />
      </GridShell>

      <GridShell pt='2'>
        <Heading size='sm' as='h3' w='20rem' justifySelf={{ md: 'center' }}>
          Physical Address
        </Heading>
      </GridShell>

      <GridShell justifyItems='center'>
        <FormInput
          name='department'
          register={register}
          errors={errors}
          label='Department'
          placeholder='Department'
        />

        <FormInput
          name='sub_department'
          register={register}
          errors={errors}
          label='Sub Department'
          placeholder='Sub Department'
        />

        <FormInput
          name='street_name'
          register={register}
          errors={errors}
          label='Street Name'
          placeholder='Street Name'
        />

        <FormInput
          name='building_number'
          register={register}
          errors={errors}
          label='Building Number'
          placeholder='Building Number'
        />

        <FormInput
          name='building_name'
          register={register}
          errors={errors}
          label='Building Name'
          placeholder='Building Name'
        />

        <FormInput
          name='floor_number'
          register={register}
          errors={errors}
          label='Floor Number'
          placeholder='Floor Number'
        />

        <FormInput
          name='room_number'
          register={register}
          errors={errors}
          label='Room Number'
          placeholder='Room Number'
        />

        <FormInput
          name='post_box'
          register={register}
          errors={errors}
          label='Post Box'
          placeholder='Post Box'
        />

        <FormInput
          name='postal_code'
          register={register}
          errors={errors}
          label='Postal Code'
          placeholder='Postal Code'
        />

        <FormInput
          name='town_name'
          register={register}
          errors={errors}
          label='Township'
          placeholder='Township'
        />

        <FormInput
          name='district_name'
          register={register}
          errors={errors}
          label='District'
          placeholder='District'
        />

        <FormInput
          name='country_subdivision'
          register={register}
          errors={errors}
          label='Country Subdivision (State/Divison)'
          placeholder='Country Subdivision'
        />

        <FormSelect
          isRequired
          name='country'
          register={register}
          errors={errors}
          label='Country'
          placeholder='Choose Country'
          options={COUNTRIES}
          errorMsg='Please select a country'
        />

        <FormInput
          name='longitude'
          register={register}
          errors={errors}
          label='Longitude'
          placeholder='Longitude'
          inputProps={{ type: 'number' }}
        />

        <FormInput
          name='latitude'
          register={register}
          errors={errors}
          label='Latitude'
          placeholder='Latitude'
          inputProps={{ type: 'number' }}
        />
      </GridShell>

      <GridShell justifyItems='center' pb={{ base: '8', sm: '12' }}>
        <FormInput
          isRequired
          name='phone_number'
          register={register}
          errors={errors}
          label='Phone Number'
          placeholder='Phone Number'
          inputProps={{ type: 'number' }}
        />

        <FormInput
          name='email'
          register={register}
          errors={errors}
          label='Email'
          placeholder='Email'
        />
      </GridShell>

      <Box alignSelf='end'>
        <CustomButton
          colorVariant='accent-outline'
          w='32'
          mr='4'
          onClick={() => setActiveStep(activeStep => activeStep - 1)}
        >
          Back
        </CustomButton>

        <CustomButton type='submit'>Save and proceed</CustomButton>
      </Box>
    </Stack>
  )
}

export default OwnerInfoForm
