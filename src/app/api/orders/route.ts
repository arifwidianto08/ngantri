import { NextRequest } from 'next/server';
import { createSuccessResponse, withErrorHandler } from '../../../lib/errors';

const createOrderHandler = async (request: NextRequest) => {
  const body = await request.json();
  
  return createSuccessResponse({
    message: 'Order endpoint working',
    receivedData: body
  }, undefined, 201);
};

export const POST = withErrorHandler(createOrderHandler);
