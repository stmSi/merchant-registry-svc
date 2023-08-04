import { useEffect } from 'react'
import { Box, Heading, Stack } from '@chakra-ui/react'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MerchantLocationType, Countries } from 'shared-lib'

import { FormReponse } from '@/types/form'
import instance from '@/lib/axiosInstance'
import { type LocationInfo, locationInfoSchema } from '@/lib/validations/registry'
import { scrollToTop } from '@/utils'
import { CustomButton } from '@/components/ui'
import { FormInput, FormSelect } from '@/components/form'
import GridShell from './GridShell'

const LOCATION_TYPES = Object.entries(MerchantLocationType).map(([, label]) => ({
  value: label,
  label,
}))

const COUNTRIES = Object.entries(Countries).map(([, label]) => ({
  value: label,
  label,
}))

interface LocationInfoFormProps {
  setActiveStep: React.Dispatch<React.SetStateAction<number>>
}

const LocationInfoForm = ({ setActiveStep }: LocationInfoFormProps) => {
  const {
    register,
    formState: { errors },
    setFocus,
    handleSubmit,
  } = useForm<LocationInfo>({
    resolver: zodResolver(locationInfoSchema),
    defaultValues: {
      country: null,
    },
  })

  const onSubmit = async (values: LocationInfo) => {
    const merchantId = sessionStorage.getItem('merchantId')
    if (merchantId == null) {
      alert('Merchant ID not found. Go back to the previous page and try again')
      return
    }

    // Server expects null instead of empty string or any other falsy value
    values.country = values.country || null

    try {
      const response = await instance.post<FormReponse>(
        `/merchants/${merchantId}/locations`,
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
        scrollToTop()
      }
    } catch (error) {
      if (isAxiosError(error)) {
        console.log(error)
        alert(
          error.response?.data?.error ||
            'Something went wrong! Please check your data and try again.'
        )
      }
    }
  }

  // focus on first input that has error after validation
  useEffect(() => {
    const firstError = Object.keys(errors)[0] as keyof LocationInfo

    if (firstError) {
      setFocus(firstError)
    }
  }, [errors, setFocus])

  return (
    <Stack as='form' onSubmit={handleSubmit(onSubmit)} pt='20' noValidate>
      <GridShell justifyItems='center'>
        <FormSelect
          isRequired
          name='location_type'
          register={register}
          errors={errors}
          label='Location Type'
          placeholder='Location Type'
          options={LOCATION_TYPES}
        />

        <FormInput
          name='web_url'
          register={register}
          errors={errors}
          label='Website URL'
          placeholder='Website URL'
        />
      </GridShell>

      <GridShell pt='2'>
        <Heading size='sm' as='h3' w='20rem' justifySelf={{ md: 'center' }}>
          Physical Business Address
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
          name='country'
          register={register}
          errors={errors}
          label='Country'
          placeholder='Choose Country'
          options={COUNTRIES}
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
          name='checkout_description'
          register={register}
          errors={errors}
          label='Checkout Counter Description'
          placeholder='Checkout Counter Description'
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

export default LocationInfoForm
